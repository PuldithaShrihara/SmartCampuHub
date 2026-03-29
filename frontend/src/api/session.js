const TOKEN_KEY = 'smart_campus_token'
const USER_KEY = 'smart_campus_user'

export function saveSession({ accessToken, email, fullName, role }) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ email, fullName, role }),
  )
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout() {
  clearSession()
}
