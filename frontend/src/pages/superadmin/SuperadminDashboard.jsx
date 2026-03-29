import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getStoredUser,
  logout,
  superadminCreateAdmin,
  superadminCreateTechnician,
  superadminListUsers,
} from '../../api/auth.js'
import '../DashboardLayout.css'

const emptyStaff = { fullName: '', email: '', password: '' }

export default function SuperadminDashboard() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [users, setUsers] = useState([])
  const [loadError, setLoadError] = useState('')
  const [adminForm, setAdminForm] = useState(emptyStaff)
  const [techForm, setTechForm] = useState(emptyStaff)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

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
      <header className="dash-topbar">
        <h1>Superadmin dashboard</h1>
        <div className="dash-topbar-actions">
          <span>
            {user?.fullName} ({user?.email})
          </span>
          <Link to="/">Home</Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dash-main">
        {msg.text ? (
          <div className={`dash-msg ${msg.type}`}>{msg.text}</div>
        ) : null}

        <div className="dash-card">
          <h2>Add admin</h2>
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
            <button type="submit" disabled={saving}>
              Create admin
            </button>
          </form>
        </div>

        <div className="dash-card">
          <h2>Add technician</h2>
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
            <button type="submit" disabled={saving}>
              Create technician
            </button>
          </form>
        </div>

        <div className="dash-card">
          <h2>All users</h2>
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
              <p style={{ color: '#757575', marginTop: 12 }}>No users yet.</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
