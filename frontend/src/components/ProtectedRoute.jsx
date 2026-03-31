import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser, getToken } from '../api/session.js'

function decodeJwtRole(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    // JWT payload is base64url encoded
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=')
    const payloadJson = atob(padded)
    const payload = JSON.parse(payloadJson)
    return payload.role || null
  } catch {
    return null
  }
}

/**
 * @param {{ allowedRoles: string[], redirectTo: string }} props
 */
export default function ProtectedRoute({ allowedRoles, redirectTo }) {
  const token = getToken()
  const user = getStoredUser()
  const role = decodeJwtRole(token || '') || user?.role

  if (!token || !role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
