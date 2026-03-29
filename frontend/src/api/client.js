import { getToken } from './session.js'

function apiBase() {
  if (import.meta.env.DEV) {
    return ''
  }
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
