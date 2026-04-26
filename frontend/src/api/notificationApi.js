import { apiPostAuth } from './client.js'

export async function adminCreateNotification(body) {
  return apiPostAuth('/api/admin/notifications', body)
}

export async function adminBroadcastNotification(body) {
  return apiPostAuth('/api/admin/notifications/broadcast', body)
}

export async function adminBroadcastNotificationToRole(role, body) {
  return apiPostAuth(`/api/admin/notifications/broadcast/role/${encodeURIComponent(role)}`, body)
}
