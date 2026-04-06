/**
 * SLIIT Google sign-in policy (must match backend student Google login).
 * Cryptographic verification still happens only on the server.
 */
export const GOOGLE_STUDENT_EMAIL_DOMAIN = 'my.sliit.lk'

export const GOOGLE_STUDENT_DOMAIN_REJECT_MESSAGE =
  'Google sign-in is only allowed for these email domains: @my.sliit.lk. Your Google account must use one of them (personal accounts such as @gmail.com are not accepted).'

/**
 * @param {string} idToken - JWT from Google Sign-In (credential)
 * @returns {string|null} email claim or null if missing/invalid
 */
export function parseEmailFromGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    return null
  }
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (b64.length % 4)) % 4
    b64 += '='.repeat(pad)
    const json = atob(b64)
    const payload = JSON.parse(json)
    const email = payload?.email
    if (typeof email !== 'string') {
      return null
    }
    const trimmed = email.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}

/**
 * @param {string|null} email
 * @returns {boolean}
 */
export function isAllowedGoogleStudentEmail(email) {
  if (!email) {
    return false
  }
  return email.toLowerCase().endsWith(`@${GOOGLE_STUDENT_EMAIL_DOMAIN}`)
}
