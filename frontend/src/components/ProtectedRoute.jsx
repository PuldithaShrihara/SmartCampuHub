import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser, getToken } from '../api/session.js'

/**
 * @param {{ allowedRoles: string[], redirectTo: string }} props
 */
export default function ProtectedRoute({ allowedRoles, redirectTo }) {
  const token = getToken()
  const user = getStoredUser()
  const role = user?.role

  if (!token || !role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
