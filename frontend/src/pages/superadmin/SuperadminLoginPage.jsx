import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { superadminLogin } from '../../api/auth.js'
import { useAuth } from '../../context/useAuth.js'
import '../AuthPage.css'

export default function SuperadminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await superadminLogin({ email, password })
      login(data)
      navigate('/superadmin/dashboard', { replace: true })
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
            <p>Superadmin sign in</p>
          </Link>
        </div>

        <div className="auth-card">
          <h2>Superadmin login</h2>
          <p
            style={{
              fontSize: 13,
              color: '#757575',
              marginTop: -12,
              marginBottom: 16,
            }}
          >
            Superadmin accounts are not self-registered. Use credentials provided
            by your system administrator (or the seeded dev account).
          </p>
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="sa-email">Username</label>
              <input
                id="sa-email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="sa-pass">Password</label>
              <input
                id="sa-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in as superadmin'}
            </button>
          </form>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
