import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentRegister } from '../../api/auth.js'
import '../AuthPage.css'

export default function StudentSignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const regEmail = email.trim().toLowerCase()
    if (!regEmail.includes('@')) {
      setError('Enter your full email address so we can send the OTP.')
      return
    }
    setLoading(true)
    try {
      const data = await studentRegister({
        fullName,
        email: regEmail,
        password,
        confirmPassword,
      })
      setSuccessMessage(data?.message || 'Account created. Check your email for OTP.')
      setTimeout(() => {
        navigate('/student/verify-otp', { state: { email: regEmail }, replace: true })
      }, 700)
    } catch (err) {
      setError(err.message || 'Registration failed')
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
            <p>Student registration</p>
          </Link>
        </div>

        <div className="auth-card">
          <h2>Sign up (Student)</h2>
          {successMessage ? (
            <div className="auth-error" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              {successMessage}
            </div>
          ) : null}
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="stu-name">Full name</label>
              <input
                id="stu-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="stu-email">Email</label>
              <input
                id="stu-email"
                type="email"
                autoComplete="email"
                placeholder="e.g. your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="stu-pass">Password</label>
              <input
                id="stu-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="stu-confirm">Confirm password</label>
              <input
                id="stu-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !!successMessage}
            >
              {loading ? 'Creating account…' : 'Create student account'}
            </button>
          </form>
          <p className="auth-footer">
            Already registered? <Link to="/student/login">Student login</Link>
            {successMessage ? (
              <>
                {' '}
                After OTP verification, <Link to="/student/login">sign in here</Link>.
              </>
            ) : null}
          </p>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
