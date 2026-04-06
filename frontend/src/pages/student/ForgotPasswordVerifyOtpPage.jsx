import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp } from '../../api/auth.js'
import '../../styles/AuthPage.css'

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase()
}

export default function ForgotPasswordVerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(normalizeEmail(location.state?.email))
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleVerify(e) {
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
    setLoading(true)
    try {
      await forgotPasswordVerifyOtp({ email: normalizedEmail, otp: cleanOtp })
      navigate('/student/forgot-password/reset', {
        state: { email: normalizedEmail, otp: cleanOtp },
        replace: true,
      })
    } catch (err) {
      setError(err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setMessage('')
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) {
      setError('Enter your email first')
      return
    }
    setResending(true)
    try {
      const data = await forgotPasswordSendOtp({ email: normalizedEmail })
      setMessage(data?.message || 'A new OTP has been sent.')
    } catch (err) {
      setError(err.message || 'Could not resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <Link to="/">
            <h1>Smart Campus Hub</h1>
            <p>Verify reset OTP</p>
          </Link>
        </div>
        <div className="auth-card">
          <h2>Verify OTP</h2>
          {message ? (
            <div className="auth-error" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              {message}
            </div>
          ) : null}
          {error ? <div className="auth-error">{error}</div> : null}
          <form onSubmit={handleVerify}>
            <div className="auth-field">
              <label htmlFor="fpv-email">Email</label>
              <input
                id="fpv-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="fpv-otp">OTP</label>
              <input
                id="fpv-otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
          <button
            type="button"
            className="auth-submit"
            style={{ marginTop: 10, background: '#1976d2' }}
            disabled={resending}
            onClick={handleResend}
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
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
