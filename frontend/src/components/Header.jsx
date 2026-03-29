import { FaBell, FaSignOutAlt } from 'react-icons/fa'
import './Header.css'

export default function Header({
  title,
  userName,
  unreadNotifications = 0,
  onNotificationClick,
  onLogout,
}) {
  const initials = (userName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>{title || 'Smart Campus Hub'}</h1>
      </div>
      <div className="app-header-right">
        <button
          type="button"
          className="header-icon-btn"
          onClick={onNotificationClick}
          aria-label="Notifications"
        >
          <FaBell />
          {unreadNotifications > 0 ? (
            <span className="header-badge">{unreadNotifications}</span>
          ) : null}
        </button>

        <div className="header-user">
          <span>{userName || 'User'}</span>
          <div className="header-avatar">{initials || 'U'}</div>
        </div>

        <button type="button" className="header-logout" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
