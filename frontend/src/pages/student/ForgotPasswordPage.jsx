import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPasswordSendOtp } from '../../api/auth.js'
import '../AuthPage.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Email is required')
      return
    }
    setLoading(true)
    try {
      const data = await forgotPasswordSendOtp({ email: normalizedEmail })
      setMessage(data?.message || 'OTP sent to your email.')
      setTimeout(() => {
        navigate('/student/forgot-password/verify-otp', { state: { email: normalizedEmail }, replace: true })
      }, 700)
    } catch (err) {
      setError(err.message || 'Could not send OTP')
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
            <p>Forgot password</p>
          </Link>
        </div>
        <div className="auth-card">
          <h2>Forgot password</h2>
          {message ? (
            <div className="auth-error" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              {message}
            </div>
          ) : null}
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          <p className="auth-footer">
            Remembered password? <Link to="/student/login">Back to login</Link>
          </p>
        </div>
        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
