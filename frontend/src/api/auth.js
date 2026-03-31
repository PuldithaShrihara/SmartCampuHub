import { apiDeleteAuth, apiGetAuth, apiPost, apiPostAuth } from './client.js'

export {
  saveSession,
  clearSession,
  getToken,
  getStoredUser,
  logout,
} from './session.js'

/** --- Public auth --- */
export async function studentRegister(body) {
  return apiPost('/api/auth/student/register', body)
}

export async function studentVerifyOtp(body) {
  return apiPost('/api/auth/verify-otp', body)
}

export async function studentResendVerification(body) {
  return apiPost('/api/auth/student/resend-verification', body)
}

export async function forgotPasswordSendOtp(body) {
  return apiPost('/api/auth/forgot-password/send-otp', body)
}

export async function forgotPasswordVerifyOtp(body) {
  return apiPost('/api/auth/forgot-password/verify-otp', body)
}

export async function forgotPasswordReset(body) {
  return apiPost('/api/auth/forgot-password/reset', body)
}

export async function studentLogin(body) {
  return apiPost('/api/auth/student/login', body)
}

export async function superadminLogin(body) {
  return apiPost('/api/auth/superadmin/login', body)
}

export async function staffLogin(body) {
  return apiPost('/api/auth/staff/login', body)
}

/** --- Superadmin (JWT) --- */
export async function superadminListUsers() {
  return apiGetAuth('/api/superadmin/users')
}

export async function superadminCreateAdmin(body) {
  return apiPostAuth('/api/superadmin/users/admin', body)
}

export async function superadminCreateTechnician(body) {
  return apiPostAuth('/api/superadmin/users/technician', body)
}

/** --- Admin (JWT) --- */
export async function adminListTechnicians() {
  return apiGetAuth('/api/admin/users/technicians')
}

export async function adminCreateTechnician(body) {
  return apiPostAuth('/api/admin/users/technician', body)
}

/** --- Admin role management (STUDENT + TECHNICIAN) --- */
export async function adminListUsers() {
  return apiGetAuth('/api/admin/users')
}

export async function adminCreateUser(body) {
  return apiPostAuth('/api/admin/users', body)
}

export async function adminHardDeleteUser(userId) {
  return apiDeleteAuth(`/api/admin/users/${userId}/hard`)
}
