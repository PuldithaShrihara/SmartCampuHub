import { apiGetAuth } from './client.js'

export async function fetchDashboardStats() {
  return apiGetAuth('/api/admin/dashboard/stats')
}

export async function fetchRecentPendingBookings() {
  return apiGetAuth('/api/admin/dashboard/recent-pending')
}

export async function fetchAiResourceInsights(period = 30) {
  const safePeriod = Number.isFinite(Number(period)) ? Number(period) : 30
  return apiGetAuth(`/api/admin/dashboard/ai-resource-insights?period=${safePeriod}`)
}
