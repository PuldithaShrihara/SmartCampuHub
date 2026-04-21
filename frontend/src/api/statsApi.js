import { apiGetAuth } from './client.js'

/**
 * Normalizes backend JSON (camelCase or snake_case) into numeric fields from MongoDB counts.
 */
export function normalizeSystemOverviewStats(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      totalBookings: 0,
      totalResources: 0,
      totalTickets: 0,
      totalUsers: 0,
    }
  }
  const n = (v) => {
    const x = Number(v)
    return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0
  }
  return {
    totalBookings: n(raw.totalBookings ?? raw.total_bookings),
    totalResources: n(raw.totalResources ?? raw.total_resources),
    totalTickets: n(raw.totalTickets ?? raw.total_tickets),
    totalUsers: n(raw.totalUsers ?? raw.total_users),
  }
}

export async function getSystemOverviewStats() {
  const data = await apiGetAuth('/api/stats/overview')
  return normalizeSystemOverviewStats(data)
}
