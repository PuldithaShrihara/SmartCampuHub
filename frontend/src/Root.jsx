import { StrictMode, useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import { fetchGoogleClientId } from './api/oauthConfig.js'
import { GoogleClientIdContext } from './context/GoogleClientIdContext.jsx'
import { applyStoredTheme } from './utils/theme.js'

export default function Root() {
  const [clientId, setClientId] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    applyStoredTheme()
    fetchGoogleClientId().then((id) => {
      setClientId(id)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return null
  }

  const tree = (
    <GoogleClientIdContext.Provider value={clientId}>
      <App />
    </GoogleClientIdContext.Provider>
  )

  if (clientId) {
    return (
      <StrictMode>
        <GoogleOAuthProvider clientId={clientId}>{tree}</GoogleOAuthProvider>
      </StrictMode>
    )
  }

  return <StrictMode>{tree}</StrictMode>
}
