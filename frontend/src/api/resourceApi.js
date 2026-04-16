import { apiGetAuth, apiPostAuthMultipart, apiPutAuthMultipart, apiDeleteAuth } from './client.js'

export async function fetchResources(filters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.capacity) params.append('minCapacity', filters.capacity)
  if (filters.location) params.append('location', filters.location)
  if (filters.status) params.append('status', filters.status)
  if (filters.category) params.append('category', filters.category)

  return apiGetAuth(`/api/resources?${params.toString()}`)
}

export async function fetchActiveResourcesByCategory(category) {
  const normalizedCategory = String(category || '').trim().toUpperCase()
  const params = new URLSearchParams()
  params.append('category', normalizedCategory)
  try {
    return await apiGetAuth(`/api/resources/active?${params.toString()}`)
  } catch {
    // Fallback for backend versions that do not expose /active by category or
    // where legacy records do not have explicit category persisted.
    const allActive = await fetchResources({ status: 'ACTIVE' })
    const normalized = Array.isArray(allActive)
      ? allActive
      : Array.isArray(allActive?.content)
        ? allActive.content
        : []
    return normalized.filter((resource) => {
      const categoryValue = String(resource?.category || '').trim().toUpperCase()
      const typeValue = String(resource?.type || '').trim().toUpperCase()
      if (normalizedCategory === 'EQUIPMENT') {
        return categoryValue === 'EQUIPMENT' || typeValue === 'EQUIPMENT'
      }
      if (normalizedCategory === 'SPACE') {
        return categoryValue === 'SPACE' || (categoryValue === '' && typeValue !== 'EQUIPMENT')
      }
      return true
    })
  }
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
