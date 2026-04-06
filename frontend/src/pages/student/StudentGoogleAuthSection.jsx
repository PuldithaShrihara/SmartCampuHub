import { GoogleLogin, googleLogout } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { studentGoogleLogin } from '../../api/auth.js'
import { useAuth } from '../../context/useAuth.js'
import { useGoogleClientId } from '../../context/GoogleClientIdContext.jsx'
import {
  GOOGLE_STUDENT_DOMAIN_REJECT_MESSAGE,
  isAllowedGoogleStudentEmail,
  parseEmailFromGoogleIdToken,
} from '../../utils/googleStudentOAuth.js'

/**
 * Shared "Sign in with Google" block for student login and signup.
 * Client ID comes from `VITE_GOOGLE_CLIENT_ID` or backend `GET /api/auth/public/oauth-config`.
 */
export function StudentGoogleAuthSection({
  setError,
  loading,
  setLoading,
}) {
  const googleClientId = useGoogleClientId()
  const navigate = useNavigate()
  const { login, logout } = useAuth()

  async function handleGoogleSuccess(credentialResponse) {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setError('Google sign-in did not return a credential.')
      return
    }

    const email = parseEmailFromGoogleIdToken(idToken)
    if (!email) {
      setError('Could not read your email from Google. Try signing in again.')
      return
    }
    if (!isAllowedGoogleStudentEmail(email)) {
      logout()
      try {
        googleLogout()
      } catch {
        /* ignore if GIS is not initialized */
      }
      setError(GOOGLE_STUDENT_DOMAIN_REJECT_MESSAGE)
      return
    }

    setError('')
    setLoading(true)
    try {
      const data = await studentGoogleLogin({ idToken })
      login(data)
      navigate('/student', { replace: true })
    } catch (err) {
      logout()
      try {
        googleLogout()
      } catch {
        /* ignore */
      }
      setError(
        err?.message ||
          GOOGLE_STUDENT_DOMAIN_REJECT_MESSAGE,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-divider">
        <span>or</span>
      </div>
      {googleClientId ? (
        <>
          <div className="auth-google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setError('Google sign-in was cancelled or failed.')
              }
              useOneTap={false}
            />
          </div>
          <p className="auth-google-domain-note">
            SLIIT Google sign-in: only <strong>@my.sliit.lk</strong> accounts
            are accepted. Other domains are blocked.
          </p>
        </>
      ) : (
        <p className="auth-google-hint">
          <strong>Google sign-in is not configured.</strong> Set{' '}
          <code>GOOGLE_OAUTH_CLIENT_ID</code> or{' '}
          <code>app.google.oauth.client-id</code> in the backend (e.g.{' '}
          <code>application-local.properties</code>), restart the backend, and
          reload this page. Optional: set <code>VITE_GOOGLE_CLIENT_ID</code> in{' '}
          <code>frontend/.env.local</code>. See{' '}
          <code>docs/google-oauth-setup.md</code>.
        </p>
      )}
    </>
  )
}
