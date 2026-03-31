import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentLogin } from '../../api/authApi.js'
import { useAuth } from '../../context/useAuth.js'
import { normalizeCampusEmail } from '../../utils/loginIdentifier.js'
import '../../styles/AuthPage.css'

export default function StudentLoginPage() {
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
      const data = await studentLogin({
        email: normalizeCampusEmail(email),
        password,
      })
      login(data)
      navigate('/student', { replace: true })
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
            <p>Student sign in</p>
          </Link>
        </div>

        <div className="auth-card">
          <h2>Student login</h2>
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="stu-login-email">Email or username</label>
              <input
                id="stu-login-email"
                type="text"
                autoComplete="username"
                placeholder="e.g. student1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="stu-login-pass">Password</label>
              <input
                id="stu-login-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-footer">
            New student? <Link to="/student/signup">Create an account</Link>
          </p>
          <p className="auth-footer" style={{ marginTop: 8 }}>
            Staff? <Link to="/staff/login">Staff login</Link>
          </p>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
