import { useEffect, useState } from 'react'
import {
  adminCreateTechnician,
  adminListTechnicians,
} from '../../api/authApi.js'
import '../../styles/DashboardLayout.css'

const emptyTech = { fullName: '', email: '', password: '' }

export default function Users() {
  const [technicians, setTechnicians] = useState([])
  const [form, setForm] = useState(emptyTech)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function loadTechnicians() {
    try {
      const list = await adminListTechnicians()
      setTechnicians(Array.isArray(list) ? list : [])
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load users' })
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      await adminCreateTechnician(form)
      setForm(emptyTech)
      setMessage({ type: 'success', text: 'Technician added successfully.' })
      await loadTechnicians()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Could not create technician',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {message.text ? (
        <div className={`dash-msg ${message.type}`}>{message.text}</div>
      ) : null}
      <div className="dash-card">
        <h2>User Management</h2>
        <p style={{ color: '#616161' }}>
          Admin can add technicians only through this Add User form.
        </p>
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
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
      <div className="dash-card">
        <h2>Technician Accounts</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((item) => (
                <tr key={item.id}>
                  <td>{item.fullName}</td>
                  <td>{item.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {technicians.length === 0 ? (
            <p style={{ color: '#757575', marginTop: 10 }}>No technicians yet.</p>
          ) : null}
        </div>
      </div>
    </>
  )
}
