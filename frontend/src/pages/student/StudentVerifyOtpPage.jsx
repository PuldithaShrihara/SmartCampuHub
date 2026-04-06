import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { studentResendVerification, studentVerifyOtp } from '../../api/auth.js'
import '../../styles/AuthPage.css'

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase()
}

export default function StudentVerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledEmail = normalizeEmail(location.state?.email)

  const [email, setEmail] = useState(prefilledEmail)
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
      const data = await studentVerifyOtp({ email: normalizedEmail, otp: cleanOtp })
      setMessage(data?.message || 'Email verified successfully.')
      setTimeout(() => {
        navigate('/student/login', { replace: true })
      }, 900)
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
      setError('Enter your email to resend OTP')
      return
    }
    setResending(true)
    try {
      const data = await studentResendVerification({ email: normalizedEmail })
      setMessage(data?.message || 'A new OTP has been sent to your email.')
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
            <p>Student OTP verification</p>
          </Link>
        </div>

        <div className="auth-card">
          <h2>Verify your account</h2>
          {message ? (
            <div className="auth-error" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              {message}
            </div>
          ) : null}
          {error ? <div className="auth-error">{error}</div> : null}

          <form onSubmit={handleVerify}>
            <div className="auth-field">
              <label htmlFor="verify-email">Email</label>
              <input
                id="verify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="verify-otp">OTP</label>
              <input
                id="verify-otp"
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
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>

          <button
            type="button"
            className="auth-submit"
            style={{ marginTop: 10, background: '#1976d2' }}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>

          <p className="auth-footer">
            Already verified? <Link to="/student/login">Student login</Link>
          </p>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
