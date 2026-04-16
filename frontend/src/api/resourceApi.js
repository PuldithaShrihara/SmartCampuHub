import { apiGetAuth, apiPostAuthMultipart, apiPutAuthMultipart, apiDeleteAuth } from './client.js'

export async function fetchResources(filters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.capacity) params.append('minCapacity', filters.capacity)
  if (filters.location) params.append('location', filters.location)
  if (filters.status) params.append('status', filters.status)

  return apiGetAuth(`/api/resources?${params.toString()}`)
}

export async function getResource(id) {
  return apiGetAuth(`/api/resources/${id}`)
}

export async function createResource(data, photo) {
  const formData = new FormData()
  // We send the JSON data as a Blob with application/json type for @RequestPart to work
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (photo) {
    formData.append('photo', photo)
  }
  return apiPostAuthMultipart('/api/resources', formData)
}

export async function updateResource(id, data, photo) {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (photo) {
    formData.append('photo', photo)
  }
  return apiPutAuthMultipart(`/api/resources/${id}`, formData)
}

export async function deleteResource(id) {
  return apiDeleteAuth(`/api/resources/${id}`)
}
