/** Base URL for unauthenticated API calls (matches `api/client.js`). */
export function publicApiBase() {
  if (import.meta.env.DEV) {
    return ''
  }
  return import.meta.env.VITE_API_BASE || 'http://localhost:8081'
}

/**
 * Resolves the Google Web client ID: optional `VITE_GOOGLE_CLIENT_ID`, else backend
 * `GET /api/auth/public/oauth-config` (so one backend config is enough for local dev).
 */
export async function fetchGoogleClientId() {
  const envId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
  if (envId) {
    return envId
  }
  try {
    const res = await fetch(
      `${publicApiBase()}/api/auth/public/oauth-config`,
    )
    if (!res.ok) {
      return ''
    }
    const data = await res.json()
    return (data.googleClientId ?? '').trim()
  } catch {
    return ''
  }
}
