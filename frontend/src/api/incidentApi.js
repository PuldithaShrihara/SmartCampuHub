import { apiDeleteAuth, apiGetAuth, apiPostAuth, apiPostAuthMultipart, apiPutAuth } from './client.js'

/**
 * createIncident()
 * This method sends a new incident ticket to the backend.
 *
 * Input (payload):
 * - title: Short incident title
 * - description: Full problem explanation
 * - resourceId: Selected resource/equipment id
 * - file (optional): Image/PDF attachment
 *
 * Output:
 * - Returns the API response Promise from backend.
 *
 * Important business note:
 * - New incidents usually start in "Pending" status.
 * - Later, technician/admin may move status to:
 *   Pending -> In Progress -> Resolved
 *
 * Why FormData?
 * - We use FormData because normal JSON cannot upload files directly.
 * - FormData allows sending text fields + binary file in one request.
 *
 * @param {{ title: string, description: string, resourceId: string, file?: File | null }} payload
 */
export async function createIncident(payload) {
  // Create multipart form container for text + file.
  const formData = new FormData()
  // Add required text values from UI form.
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('resourceId', payload.resourceId)
  // Attach file only if user selected one.
  if (payload.file) {
    formData.append('file', payload.file)
  }
  // Send authenticated multipart POST request to create incident.
  return apiPostAuthMultipart('/api/incidents', formData)
}

/**
 * getMyIncidents()
 * This method loads incidents created by the logged-in user/student.
 *
 * Input:
 * - No parameters
 *
 * Output:
 * - Returns the API response Promise (usually a list in response.data).
 *
 * Role-based access note:
 * - Backend uses logged-in token, so user sees only "my" incidents.
 */
export async function getMyIncidents() {
  return apiGetAuth('/api/incidents/my')
}

/**
 * updateMyIncident()
 * This method updates one incident owned by the logged-in user.
 *
 * Input:
 * - incidentId: Target incident id
 * - payload: Updated title/description/resourceId
 *
 * Output:
 * - Returns the API response Promise after update.
 *
 * Business rule (handled mainly in backend):
 * - Usually students can edit only while incident is still "Pending".
 * - If status is already "In Progress" or "Resolved", update may be blocked.
 *
 * @param {string} incidentId
 * @param {{title: string, description: string, resourceId: string}} payload
 */
export async function updateMyIncident(incidentId, payload) {
  return apiPutAuth(`/api/incidents/my/${incidentId}`, payload)
}

/**
 * deleteMyIncident()
 * This method deletes one incident owned by the logged-in user.
 *
 * Input:
 * - incidentId: Incident id to delete
 *
 * Output:
 * - Returns the API response Promise.
 *
 * Business rule:
 * - Commonly allowed only for "Pending" incidents.
 *
 * @param {string} incidentId
 */
export async function deleteMyIncident(incidentId) {
  return apiDeleteAuth(`/api/incidents/my/${incidentId}`)
}

/**
 * getAllIncidents()
 * This method loads all incidents (mainly used by admin/technician pages).
 *
 * Input:
 * - status (optional): Filter incidents by one status
 *   Example values: "Pending", "In Progress", "Resolved"
 *
 * Output:
 * - Returns the API response Promise with incident list.
 *
 * Role-based access note:
 * - Backend decides who can view full/all incidents based on JWT role.
 * - Typical roles: admin/technician have broader access than normal users.
 */
export async function getAllIncidents(status = '') {
  // Build query string only when status filter is selected.
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  // Send authenticated GET request with/without filter.
  return apiGetAuth(`/api/incidents${query}`)
}

/**
 * updateIncident()
 * This method updates an incident from admin/technician side.
 *
 * Input:
 * - incidentId: Target incident id
 * - payload:
 *   - status (optional): Incident status update
 *   - technicianRemarks (optional): Technician notes/comments
 *   - assignedTo (optional): Technician user id for assignment
 *
 * Output:
 * - Returns the API response Promise after update.
 *
 * Business logic examples:
 * - Admin can assign technician using assignedTo.
 * - Technician can add remarks and change status.
 * - Status flow should follow:
 *   Pending -> In Progress -> Resolved
 * - Backend validates permissions and invalid transitions.
 *
 * @param {string} incidentId
 * @param {{status?: string, technicianRemarks?: string, assignedTo?: string}} payload
 */
export async function updateIncident(incidentId, payload) {
  return apiPutAuth(`/api/incidents/${incidentId}`, payload)
}

/**
 * acceptIncidentAssignment()
 * Technician accepts an assigned incident task.
 *
 * Input:
 * - incidentId: Assigned incident id
 *
 * Output:
 * - Returns API response Promise (assignment status change result).
 *
 * Role-based access note:
 * - Only the assigned technician should be allowed by backend.
 */
export async function acceptIncidentAssignment(incidentId) {
  return apiPostAuth(`/api/incidents/${incidentId}/accept`, {})
}

/**
 * declineIncidentAssignment()
 * Technician declines an assigned incident task.
 *
 * Input:
 * - incidentId: Assigned incident id
 *
 * Output:
 * - Returns API response Promise (assignment status change result).
 *
 * Role-based access note:
 * - Only the assigned technician should be allowed by backend.
 */
export async function declineIncidentAssignment(incidentId) {
  return apiPostAuth(`/api/incidents/${incidentId}/decline`, {})
}
