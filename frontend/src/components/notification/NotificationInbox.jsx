import { useEffect, useMemo, useState } from 'react'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications.js'
import '../../styles/NotificationInbox.css'

const TYPES = ['ALL', 'BOOKING', 'TICKET', 'RESOURCE', 'REMINDER', 'SYSTEM']

function isLegacyIncidentSubmitMessage(message) {
  const text = String(message || '').toLowerCase()
  return (
    text.includes('you can track it under incidents.') &&
    (text.includes('incident submitted successfully') || text.includes('incident report was submitted successfully'))
  )
}

export default function NotificationInbox({ title = 'Notifications', autoRefreshMs = 30000 }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEWEST')
  const [markingAll, setMarkingAll] = useState(false)
  const [markingOneId, setMarkingOneId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await listNotifications()
      const list = Array.isArray(res) ? res : []
      // Hide old auto-generated submit-confirmation notifications to avoid repeated popup-like noise.
      setNotifications(list.filter((item) => !isLegacyIncidentSubmitMessage(item?.message)))
    } catch (err) {
      setError(err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0) return
    const id = window.setInterval(load, autoRefreshMs)
    return () => window.clearInterval(id)
  }, [autoRefreshMs])

  async function handleMarkRead(notificationId) {
    try {
      setMarkingOneId(notificationId)
      await markNotificationRead(notificationId)
      window.alert('Marked as read.')
      await load()
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      window.alert(err?.message || 'Could not mark as read.')
    } finally {
      setMarkingOneId('')
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true)
      const result = await markAllNotificationsRead()
      const updatedCount = result?.updatedCount || 0
      window.alert(updatedCount > 0 ? `Marked ${updatedCount} notification(s) as read.` : 'No unread notifications.')
      await load()
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (err) {
      window.alert(err?.message || 'Could not mark all as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  const summary = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter((n) => !n.readAt).length
    const read = total - unread
    const today = notifications.filter((n) => {
      if (!n?.createdAt) return false
      const d = new Date(n.createdAt)
      const now = new Date()
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    }).length
    return { total, unread, read, today }
  }, [notifications])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = notifications.filter((n) => {
      const isRead = Boolean(n?.readAt)
      if (statusFilter === 'UNREAD' && isRead) return false
      if (statusFilter === 'READ' && !isRead) return false
      if (typeFilter !== 'ALL' && String(n?.type || '').toUpperCase() !== typeFilter) return false
      if (q) {
        const hay = `${n?.message || ''} ${n?.type || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    list.sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime()
      const tb = new Date(b?.createdAt || 0).getTime()
      return sortOrder === 'NEWEST' ? tb - ta : ta - tb
    })
    return list
  }, [notifications, search, statusFilter, typeFilter, sortOrder])

  return (
    <div className="dash-card notification-inbox">
      <div className="notification-inbox-header">
        <h2>{title}</h2>
        <div className="notification-inbox-actions">
          <button type="button" className="dash-btn-outline" onClick={load} disabled={loading}>
            Refresh
          </button>
          <button type="button" className="dash-btn" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        </div>
      </div>

      <div className="notification-stats-grid">
        <Stat label="Total" value={summary.total} />
        <Stat label="Unread" value={summary.unread} />
        <Stat label="Read" value={summary.read} />
        <Stat label="Today" value={summary.today} />
      </div>

      <div className="notification-filters">
        <input
          type="text"
          placeholder="Search message/type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All status</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="NEWEST">Newest first</option>
          <option value="OLDEST">Oldest first</option>
        </select>
      </div>

      {error ? <div className="dash-msg error">{error}</div> : null}
      {loading ? <p style={{ color: '#616161' }}>Loading...</p> : null}

      {!loading && filtered.length === 0 ? (
        <p style={{ color: '#616161' }}>No notifications found for the selected filters.</p>
      ) : null}

      {!loading && filtered.length > 0 ? (
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
              {filtered.map((n) => {
                const isRead = Boolean(n.readAt)
                return (
                  <tr key={n.id}>
                    <td className="notification-message-cell">{n.message}</td>
                    <td>
                      <span className={`notification-type-pill type-${String(n.type || '').toLowerCase()}`}>
                        {n.type}
                      </span>
                    </td>
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
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          disabled={markingOneId === n.id}
                        >
                          {markingOneId === n.id ? 'Marking...' : 'Mark read'}
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

function Stat({ label, value }) {
  return (
    <div className="notification-stat-card">
      <div className="notification-stat-label">{label}</div>
      <div className="notification-stat-value">{String(value)}</div>
    </div>
  )
}
