import { useState } from 'react'
import {
  adminBroadcastNotification,
  adminBroadcastNotificationToRole,
  adminCreateNotification,
} from '../../api/notificationApi.js'
import NotificationInbox from '../../components/notification/NotificationInbox.jsx'
import '../../styles/AdminNotificationsPage.css'

export default function Notifications() {
  const [compose, setCompose] = useState({
    targetMode: 'single',
    targetRole: 'STUDENT',
    userEmail: '',
    message: '',
    type: 'SYSTEM',
  })
  const [sending, setSending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    const message = compose.message.trim()
    if (!message) {
      window.alert('Message is required.')
      return
    }
    if (message.length > 1000) {
      window.alert('Message must be at most 1000 characters.')
      return
    }
    if (compose.targetMode === 'single' && !compose.userEmail.trim()) {
      window.alert('Target user email is required.')
      return
    }

    setSending(true)
    try {
      if (compose.targetMode === 'single') {
        await adminCreateNotification({
          userEmail: compose.userEmail.trim(),
          message,
          type: compose.type,
        })
      } else if (compose.targetMode === 'role') {
        await adminBroadcastNotificationToRole(compose.targetRole, {
          message,
          type: compose.type,
        })
      } else {
        await adminBroadcastNotification({
          message,
          type: compose.type,
        })
      }
      window.alert('Notification sent successfully.')
      setCompose((prev) => ({
        ...prev,
        userEmail: '',
        message: '',
        type: 'SYSTEM',
      }))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      window.alert(err.message || 'Could not send notification.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="dash-card">
      <h2>Notifications</h2>
      <form onSubmit={handleSend} className="admin-notification-form">
        <div className="admin-notification-row">
          <div className="admin-notification-field">
            <label htmlFor="targetMode">Recipient type</label>
            <select
              id="targetMode"
              value={compose.targetMode}
              onChange={(e) => setCompose((prev) => ({ ...prev, targetMode: e.target.value }))}
            >
              <option value="single">Single user</option>
              <option value="role">Role group</option>
              <option value="all">All users</option>
            </select>
          </div>

          {compose.targetMode === 'single' ? (
            <div className="admin-notification-field">
              <label htmlFor="targetEmail">Target user email</label>
              <input
                id="targetEmail"
                type="email"
                placeholder="student@my.sliit.lk"
                value={compose.userEmail}
                onChange={(e) => setCompose((prev) => ({ ...prev, userEmail: e.target.value }))}
              />
            </div>
          ) : null}

          {compose.targetMode === 'role' ? (
            <div className="admin-notification-field">
              <label htmlFor="targetRole">Role</label>
              <select
                id="targetRole"
                value={compose.targetRole}
                onChange={(e) => setCompose((prev) => ({ ...prev, targetRole: e.target.value }))}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>
          ) : null}

          <div className="admin-notification-field">
            <label htmlFor="notificationType">Type</label>
            <select
              id="notificationType"
              value={compose.type}
              onChange={(e) => setCompose((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="SYSTEM">SYSTEM</option>
              <option value="BOOKING">BOOKING</option>
              <option value="TICKET">TICKET</option>
              <option value="RESOURCE">RESOURCE</option>
              <option value="REMINDER">REMINDER</option>
            </select>
          </div>
        </div>

        <div className="admin-notification-field">
          <label htmlFor="notificationMessage">Message</label>
          <textarea
            id="notificationMessage"
            rows={3}
            maxLength={1000}
            placeholder="Enter the notification text..."
            value={compose.message}
            onChange={(e) => setCompose((prev) => ({ ...prev, message: e.target.value }))}
          />
        </div>

        <div className="admin-notification-actions">
          <span className="admin-notification-char-count">{compose.message.length}/1000</span>
          <button type="submit" className="dash-btn" disabled={sending}>
            {sending ? 'Sending...' : 'Send notification'}
          </button>
        </div>
      </form>

      <NotificationInbox title="Notifications Inbox" />
    </div>
  )
}

