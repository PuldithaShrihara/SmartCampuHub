import { apiGetAuth, apiPatchAuth } from './client.js'

export async function listNotifications() {
  return apiGetAuth('/api/notifications')
}

export async function getUnreadNotificationCount() {
  return apiGetAuth('/api/notifications/unread-count')
}

export async function markNotificationRead(notificationId) {
  return apiPatchAuth(`/api/notifications/${notificationId}/read`, {})
}

