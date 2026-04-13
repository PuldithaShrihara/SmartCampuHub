import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentLogin } from '../../api/authApi.js'
import { useAuth } from '../../context/useAuth.js'
import { StudentGoogleAuthSection } from '../student/StudentGoogleAuthSection.jsx'
import '../../styles/AuthPage.css'

const STUDENT_EMAIL_DOMAIN = 'my.sliit.lk'
const STUDENT_DOMAIN_REJECT_MESSAGE = `Only @${STUDENT_EMAIL_DOMAIN} email addresses are allowed for student login.`

export default function StudentLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizeStudentLoginEmail(raw) {
    const t = raw.trim().toLowerCase()
    if (!t) {
      return { email: t, error: 'Email is required' }
    }
    if (t.includes('@')) {
      if (!t.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
        return { email: t, error: STUDENT_DOMAIN_REJECT_MESSAGE }
      }
      return { email: t, error: null }
    }
    return { email: `${t}@${STUDENT_EMAIL_DOMAIN}`, error: null }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const normalized = normalizeStudentLoginEmail(email)
    if (normalized.error) {
      setError(normalized.error)
      return
    }
    setLoading(true)
    try {
      const data = await studentLogin({
        email: normalized.email,
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

          <StudentGoogleAuthSection
            setError={setError}
            loading={loading}
            setLoading={setLoading}
          />

          <p className="auth-footer">
            New student? <Link to="/student/signup">Create an account</Link>
          </p>
          <p className="auth-footer" style={{ marginTop: 8 }}>
            Forgot password? <Link to="/student/forgot-password">Reset with OTP</Link>
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
