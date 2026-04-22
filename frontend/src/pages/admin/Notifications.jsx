import { useEffect, useState } from 'react'
import { listNotifications, markNotificationRead } from '../../api/notifications.js'
import { useToast } from '../../components/toastContext.js'

export default function Notifications() {
  const { pushToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await listNotifications()
      // Validate payload shape to keep notification table resilient to API wrapper variations.
      setNotifications(Array.isArray(res) ? res : [])
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleMarkRead(notificationId) {
    try {
      // Mark read first, then refresh and notify global listeners (badge counters, sidebars, etc.).
      await markNotificationRead(notificationId)
      pushToast({ type: 'success', message: 'Marked as read.' })
      await load()
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      pushToast({ type: 'error', message: err.message || 'Could not mark as read.' })
    }
  }

  return (
    <div className="dash-card">
      <h2>Notifications</h2>

      {error ? <div className="dash-msg error">{error}</div> : null}

      {loading ? <p style={{ color: '#616161' }}>Loading...</p> : null}

      {!loading && notifications.length === 0 && !error ? (
        <p style={{ color: '#616161' }}>No notifications yet.</p>
      ) : null}

      {!loading && notifications.length > 0 ? (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Type</th>
                <th>When</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => {
                const isRead = Boolean(n.readAt)
                return (
                  <tr key={n.id}>
                    <td style={{ maxWidth: 380 }}>{n.message}</td>
                    <td>{n.type}</td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}</td>
                    <td>
                      <span
                        className="dash-badge"
                        style={{
                          background: isRead ? '#f5f5f5' : '#e8eaf6',
                          color: isRead ? '#616161' : '#1a237e',
                        }}
                      >
                        {isRead ? 'READ' : 'UNREAD'}
                      </span>
                    </td>
                    <td>
                      {isRead ? (
                        <button type="button" disabled style={{ opacity: 0.6 }}>
                          Read
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleMarkRead(n.id)}>
                          Mark read
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

