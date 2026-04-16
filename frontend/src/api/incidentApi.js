import { apiGetAuth, apiPostAuthMultipart, apiPutAuth } from './client.js'

/**
 * @param {{ title: string, description: string, resourceId: string, file?: File | null }} payload
 */
export async function createIncident(payload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('resourceId', payload.resourceId)
  if (payload.file) {
    formData.append('file', payload.file)
  }
  return apiPostAuthMultipart('/api/incidents', formData)
}

export async function getMyIncidents() {
  return apiGetAuth('/api/incidents/my')
}

export async function getAllIncidents(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiGetAuth(`/api/incidents${query}`)
}

/**
 * @param {string} incidentId
 * @param {{status?: string, technicianRemarks?: string, assignedTo?: string}} payload
 */
export async function updateIncident(incidentId, payload) {
  return apiPutAuth(`/api/incidents/${incidentId}`, payload)
}
