import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  FaUserShield,
  FaTools,
  FaUsers,
  FaHome,
} from 'react-icons/fa'
import {
  getStoredUser,
  logout as clearSession,
  superadminCreateAdmin,
  superadminCreateTechnician,
  superadminListUsers,
} from '../../api/authApi.js'
import { useAuth } from '../../context/useAuth.js'
import Sidebar from '../../components/common/Sidebar.jsx'
import Header from '../../components/common/Header.jsx'
import '../../styles/DashboardLayout.css'

const emptyStaff = { fullName: '', email: '', password: '' }

export default function SuperadminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loadError, setLoadError] = useState('')
  const [adminForm, setAdminForm] = useState(emptyStaff)
  const [techForm, setTechForm] = useState(emptyStaff)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const menuItems = [
    { label: 'Overview', icon: FaHome, path: '/superadmin/dashboard', end: true },
    { label: 'Platform Users', icon: FaUsers, path: '/superadmin/dashboard' },
  ]

  async function refresh() {
    setLoadError('')
    try {
      const list = await superadminListUsers()
      setUsers(Array.isArray(list) ? list : [])
    } catch (e) {
      setLoadError(e.message || 'Could not load users')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function handleLogout() {
    clearSession()
    logout()
    navigate('/superadmin/login', { replace: true })
  }

  async function submitAdmin(e) {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    setSaving(true)
    try {
      await superadminCreateAdmin(adminForm)
      setAdminForm(emptyStaff)
      setMsg({ type: 'success', text: 'Admin user created successfully.' })
      await refresh()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create admin' })
    } finally {
      setSaving(false)
    }
  }

  async function submitTech(e) {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    setSaving(true)
    try {
      await superadminCreateTechnician(techForm)
      setTechForm(emptyStaff)
      setMsg({ type: 'success', text: 'Technician user created successfully.' })
      await refresh()
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.message || 'Failed to create technician',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-page">
      <Sidebar
        menuItems={menuItems}
        userRole="SUPERADMIN"
        userName={user?.fullName}
        onLogout={handleLogout}
      />
      <div className="dash-main-v2">
        <Header
          title="Superadmin Dashboard"
          userName={user?.fullName}
          onLogout={handleLogout}
        />
        <div className="dash-content-v2">
          {msg.text ? (
            <div className={`dash-msg ${msg.type}`}>{msg.text}</div>
          ) : null}

          <div className="dash-card">
            <h2>Add Platform Admin</h2>
            <form className="dash-form-grid" onSubmit={submitAdmin}>
              <div>
                <label>Full name</label>
                <input
                  value={adminForm.fullName}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, fullName: e.target.value })
                  }
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  required
                  minLength={8}
                  maxLength={72}
                />
              </div>
              <button type="submit" className="dash-btn" disabled={saving}>
                Create Admin
              </button>
            </form>
          </div>

          <div className="dash-card">
            <h2>Add Campus Technician</h2>
            <form className="dash-form-grid" onSubmit={submitTech}>
              <div>
                <label>Full name</label>
                <input
                  value={techForm.fullName}
                  onChange={(e) =>
                    setTechForm({ ...techForm, fullName: e.target.value })
                  }
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={techForm.email}
                  onChange={(e) =>
                    setTechForm({ ...techForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  value={techForm.password}
                  onChange={(e) =>
                    setTechForm({ ...techForm, password: e.target.value })
                  }
                  required
                  minLength={8}
                  maxLength={72}
                />
              </div>
              <button type="submit" className="dash-btn" disabled={saving}>
                Create Technician
              </button>
            </form>
          </div>

          <div className="dash-card">
            <h2>All System Users</h2>
            {loadError ? (
              <div className="dash-msg error">{loadError}</div>
            ) : null}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="dash-badge">{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && !loadError ? (
                <p style={{ color: '#757575', marginTop: 12 }}>No users found in the system.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
