import { getToken } from './session.js'

function apiBase() {
  // In development we use Vite proxy, so keep base empty and call relative "/api/..." paths.
  if (import.meta.env.DEV) {
    return ''
  }
  // In production, use configured backend URL (or fallback).
  return import.meta.env.VITE_API_BASE || 'http://localhost:8081'
}

async function parseResponse(res) {
  let data = {}
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }
  if (!res.ok) {
    let msg =
      data.message ||
      data.detail ||
      data.error ||
      (Array.isArray(data.errors) ? data.errors.join('; ') : null) ||
      res.statusText
    if (res.status === 502) {
      // Friendly message for the common case where frontend is running but backend is down.
      msg =
        "Can't reach the backend API (Bad Gateway). Start the Spring Boot server on port 8081 and ensure MongoDB is running, then try again."
    }
    throw new Error(typeof msg === 'string' ? msg : 'Request failed')
  }
  return data
}

/**
 * @param {string} path
 * @param {object} body
 */
export async function apiPost(path, body) {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 */
export async function apiGetAuth(path) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  // This is where frontend attaches JWT token so backend can identify role/user.
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 * @param {object} body
 */
export async function apiPostAuth(path, body) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  // Sends authenticated JSON request to protected backend endpoints.
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 * @param {object} body
 */
export async function apiPatchAuth(path, body = {}) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 */
export async function apiDeleteAuth(path) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 * @param {object} body
 */
export async function apiPutAuth(path, body = {}) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  // Used for update flows (status changes, assignment updates, remarks, etc.).
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 * @param {FormData} formData
 */
export async function apiPostAuthMultipart(path, formData) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  // Multipart is required for file upload (image/pdf) with other form fields.
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  return parseResponse(res)
}

/**
 * @param {string} path
 * @param {FormData} formData
 */
export async function apiPutAuthMultipart(path, formData) {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  return parseResponse(res)
}
