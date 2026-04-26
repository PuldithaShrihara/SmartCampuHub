import {
  apiDeleteAuth,
  apiGetAuth,
  apiPatchAuth,
  apiPostAuth,
  apiPostAuthMultipart,
} from './client.js'
import { getToken } from './session.js'

function unwrap(res) {
  if (res && typeof res === 'object' && 'data' in res) {
    return res.data
  }
  return res
}

export async function getMe() {
  return unwrap(await apiGetAuth('/api/me'))
}

export async function updateProfile(body) {
  return unwrap(await apiPatchAuth('/api/me/profile', body))
}

export async function uploadAvatar(file) {
  const fd = new FormData()
  fd.append('file', file)
  return unwrap(await apiPostAuthMultipart('/api/me/avatar', fd))
}

export async function changePassword(body) {
  return unwrap(await apiPostAuth('/api/me/password/change', body))
}

export async function resendMyVerification() {
  return unwrap(await apiPostAuth('/api/me/email/resend-verification', {}))
}

export async function linkGoogleAccount(idToken) {
  return unwrap(await apiPostAuth('/api/me/google/link', { idToken }))
}

export async function unlinkGoogleAccount() {
  return unwrap(await apiDeleteAuth('/api/me/google/unlink'))
}

export async function updatePreferences(patch) {
  return unwrap(await apiPatchAuth('/api/me/preferences', patch || {}))
}

export async function requestAccountDeletion() {
  return unwrap(await apiPostAuth('/api/me/delete-request', {}))
}

export async function cancelAccountDeletionRequest() {
  return unwrap(await apiDeleteAuth('/api/me/delete-request'))
}

/**
 * Triggers a browser download of the data export JSON. Uses fetch directly so the file
 * can be saved with a friendly filename instead of going through the JSON parser in client.js.
 */
export async function downloadMyDataExport() {
  const token = getToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  const base = import.meta.env.DEV
    ? ''
    : import.meta.env.VITE_API_BASE || 'http://localhost:8081'
  const res = await fetch(`${base}/api/me/export`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Failed to download data export')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'smartcampus-data-export.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
