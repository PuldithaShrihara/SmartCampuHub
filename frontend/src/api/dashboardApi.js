import { apiGetAuth } from './client.js'

export async function fetchDashboardStats() {
  return apiGetAuth('/api/admin/dashboard/stats')
}

export async function fetchRecentPendingBookings() {
  return apiGetAuth('/api/admin/dashboard/recent-pending')
}
