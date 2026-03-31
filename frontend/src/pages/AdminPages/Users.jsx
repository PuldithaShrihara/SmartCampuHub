import { useEffect, useState } from 'react'
import { adminCreateUser, adminHardDeleteUser, adminListUsers } from '../../api/auth.js'
import { useToast } from '../../components/toastContext.js'
import '../DashboardLayout.css'

const emptyForm = { fullName: '', email: '', password: '', role: 'TECHNICIAN' }

export default function Users() {
  const { pushToast } = useToast()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  async function loadUsers() {
    try {
      const list = await adminListUsers()
      setUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load users' })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      await adminCreateUser(form)
      setForm(emptyForm)
      setMessage({ type: 'success', text: 'User added successfully.' })
      pushToast({ type: 'success', message: 'User added successfully.' })
      await loadUsers()
    } catch (err) {
      pushToast({ type: 'error', message: err.message || 'Could not add user.' })
      setMessage({
        type: 'error',
        text: err.message || 'Could not add user',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleHardDelete(item) {
    const ok = window.confirm(
      `Permanently delete ${item.fullName} (${item.email})?\nThis cannot be undone.`
    )
    if (!ok) return
    setDeletingId(item.id)
    setMessage({ type: '', text: '' })
    try {
      await adminHardDeleteUser(item.id)
      pushToast({ type: 'success', message: 'User permanently deleted.' })
      setMessage({ type: 'success', text: 'User permanently deleted.' })
      await loadUsers()
    } catch (err) {
      pushToast({ type: 'error', message: err.message || 'Could not delete user.' })
      setMessage({ type: 'error', text: err.message || 'Could not delete user.' })
    } finally {
      setDeletingId('')
    }
  }

  return (
    <>
      {message.text ? (
        <div className={`dash-msg ${message.type}`}>{message.text}</div>
      ) : null}
      <div className="dash-card">
        <h2>User Management</h2>
        <p style={{ color: '#616161' }}>Admin can add `STUDENT` and `TECHNICIAN` users.</p>
        <h3 style={{ margin: '14px 0' }}>Add User</h3>
        <form className="dash-form-grid" onSubmit={handleSubmit}>
          <div>
            <label>Full name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              maxLength={72}
            />
          </div>
          <div>
            <label>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
              style={{
                width: '100%',
                maxWidth: 400,
                boxSizing: 'border-box',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            >
              <option value="STUDENT">STUDENT</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
      <div className="dash-card">
        <h2>Student + Technician Accounts</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.fullName}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleHardDelete(item)}
                      disabled={deletingId === item.id}
                      style={{ background: '#c62828' }}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Hard Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p style={{ color: '#757575', marginTop: 10 }}>No users found.</p>
          ) : null}
        </div>
      </div>
    </>
  )
}
