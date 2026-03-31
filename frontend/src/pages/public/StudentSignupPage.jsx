import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentRegister } from '../../api/authApi.js'
import { useAuth } from '../../context/useAuth.js'
import { normalizeCampusEmail } from '../../utils/loginIdentifier.js'
import '../../styles/AuthPage.css'

export default function StudentSignupPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const data = await studentRegister({
        fullName,
        email: normalizeCampusEmail(email),
        password,
        confirmPassword,
      })
      login(data)
      navigate('/student', { replace: true })
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
              <label htmlFor="stu-email">Email or username</label>
              <input
                id="stu-email"
                type="text"
                autoComplete="email"
                placeholder="e.g. student1 or name@school.edu"
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
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create student account'}
            </button>
          </form>
          <p className="auth-footer">
            Already registered? <Link to="/student/login">Student login</Link>
          </p>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
