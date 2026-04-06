import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { forgotPasswordReset } from '../../api/auth.js'
import '../../styles/AuthPage.css'

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase()
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(normalizeEmail(location.state?.email))
  const [otp, setOtp] = useState(String(location.state?.otp || '').trim())
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    const normalizedEmail = normalizeEmail(email)
    const cleanOtp = otp.trim()
    if (!normalizedEmail) {
      setError('Email is required')
      return
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('OTP must be 6 digits')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const data = await forgotPasswordReset({
        email: normalizedEmail,
        otp: cleanOtp,
        newPassword,
        confirmPassword,
      })
      setMessage(data?.message || 'Password reset successful.')
      setTimeout(() => navigate('/student/login', { replace: true }), 900)
    } catch (err) {
      setError(err.message || 'Could not reset password')
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
            <p>Reset password</p>
          </Link>
        </div>
        <div className="auth-card">
          <h2>Reset password</h2>
          {message ? (
            <div className="auth-error" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              {message}
            </div>
          ) : null}
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="r-email">Email</label>
              <input
                id="r-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="r-otp">OTP</label>
              <input
                id="r-otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="r-pass">New password</label>
              <input
                id="r-pass"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="r-confirm">Confirm new password</label>
              <input
                id="r-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
          <p className="auth-footer">
            <Link to="/student/login">Back to login</Link>
          </p>
        </div>
        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
