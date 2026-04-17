import { NavLink } from 'react-router-dom'
import '../../styles/Sidebar.css'

export default function Sidebar({ menuItems, userRole, userName, onLogout }) {
  const initials = (userName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Smart Campus</div>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' sidebar-item-active' : ''}`
            }
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{initials || 'U'}</div>
          <div className="sidebar-user-meta">
            <strong>{userName || 'User'}</strong>
            <span className="sidebar-role">{userRole}</span>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="sidebar-logout">
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
