import { FaBell, FaBars } from 'react-icons/fa'
import '../../styles/Header.css'

export default function Header({
  title,
  userName,
  userRole = 'STUDENT',
  unreadNotifications = 0,
  onNotificationClick,
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
        <button type="button" className="hamburger-btn">
          <FaBars />
        </button>
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

        <div className="header-profile-wrap">
          <div className="header-user-info">
            <span>{userName || 'User'}</span>
            <small>{userRole}</small>
          </div>
          <div className="header-avatar">{initials || 'U'}</div>
        </div>
      </div>
    </header>
  )
}
