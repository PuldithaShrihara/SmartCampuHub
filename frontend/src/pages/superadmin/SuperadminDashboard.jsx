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
    <div className="dashboard-container">
      <Sidebar
        menuItems={menuItems}
        userRole="SUPERADMIN"
        userName={user?.fullName}
        onLogout={handleLogout}
      />
      <div className="dashboard-main">
        <Header
          title="Superadmin Dashboard"
          userName={user?.fullName}
          userRole="SUPERADMIN"
        />
        <div className="dashboard-content">
          <div className="student-home">
            <div className="home-welcome">
              <div className="welcome-text">
                <h2>Superuser Panel</h2>
                <p className="welcome-sub">Managing Smart Campus platform infrastructure.</p>
              </div>
            </div>

            {msg.text ? (
              <div className={`dash-msg ${msg.type}`} style={{ marginBottom: 24 }}>{msg.text}</div>
            ) : null}

            <div className="home-sections">
              <div className="section-card">
                <div className="section-header">
                  <h3>Add Platform Admin</h3>
                </div>
                <form className="dash-form-grid" onSubmit={submitAdmin}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Full name</label>
                    <input
                      className="form-input"
                      value={adminForm.fullName}
                      onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="sidebar-logout" style={{ background: 'var(--primary)', border: 'none' }} disabled={saving}>
                    Create Admin
                  </button>
                </form>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <h3>Add Campus Technician</h3>
                </div>
                <form className="dash-form-grid" onSubmit={submitTech}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Full name</label>
                    <input
                      className="form-input"
                      value={techForm.fullName}
                      onChange={(e) => setTechForm({ ...techForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={techForm.email}
                      onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={techForm.password}
                      onChange={(e) => setTechForm({ ...techForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="sidebar-logout" style={{ background: 'var(--primary)', border: 'none' }} disabled={saving}>
                    Create Technician
                  </button>
                </form>
              </div>
            </div>

            <div className="section-card" style={{ marginTop: 24 }}>
              <div className="section-header">
                <h3>All System Users</h3>
              </div>
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
                          <span className={`dash-badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          outline: none;
          transition: var(--transition);
        }
        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(72, 79, 209, 0.1);
        }
      `}</style>
    </div>
  )
}
