/** Campus login: if the user omits @, append this domain (matches backend demo seed). */
export const CAMPUS_EMAIL_DOMAIN = '@smartcampus.local'

/**
 * @param {string} raw
 * @returns {string} Lowercased email; `student1` → `student1@smartcampus.local`
 */
export function normalizeCampusEmail(raw) {
  const t = raw.trim().toLowerCase()
  if (!t) return t
  return t.includes('@') ? t : `${t}${CAMPUS_EMAIL_DOMAIN}`
}
