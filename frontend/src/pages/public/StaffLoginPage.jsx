import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { staffLogin } from '../../api/authApi.js'
import { useAuth } from '../../context/useAuth.js'
import { normalizeCampusEmail } from '../../utils/loginIdentifier.js'
import '../../styles/AuthPage.css'

export default function StaffLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loginType, setLoginType] = useState('ADMIN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await staffLogin({
        email: normalizeCampusEmail(email),
        password,
        loginType,
      })
      login(data)
      if (data.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/technician', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <Link to="/">
            <h1>Smart Campus Hub</h1>
            <p>Staff sign in</p>
          </Link>
        </div>

        <div className="auth-card">
          <h2>Staff login</h2>
          <p
            style={{
              fontSize: 13,
              color: '#757575',
              marginTop: -12,
              marginBottom: 16,
            }}
          >
            Choose how you are signing in. Your account role must match the
            option you select.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setLoginType('ADMIN')}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '12px 16px',
                borderRadius: 4,
                border:
                  loginType === 'ADMIN'
                    ? '2px solid #3f51b5'
                    : '1px solid #e0e0e0',
                background: loginType === 'ADMIN' ? '#e8eaf6' : '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Login as Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginType('TECHNICIAN')}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '12px 16px',
                borderRadius: 4,
                border:
                  loginType === 'TECHNICIAN'
                    ? '2px solid #3f51b5'
                    : '1px solid #e0e0e0',
                background: loginType === 'TECHNICIAN' ? '#e8eaf6' : '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Login as Technician
            </button>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="staff-email">Email or username</label>
              <input
                id="staff-email"
                type="text"
                autoComplete="username"
                placeholder={
                  loginType === 'ADMIN' ? 'e.g. admin' : 'e.g. tech1'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="staff-pass">Password</label>
              <input
                id="staff-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: 16 }}>
            Student? <Link to="/student/login">Student login</Link>
          </p>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
