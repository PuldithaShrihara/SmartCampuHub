import { useMemo, useState } from 'react'
import { getStoredUser, logout as clearStoredSession, saveSession } from '../api/auth.js'
import { AuthContext } from './authContextObject.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  function login(authResponse) {
    saveSession(authResponse)
    setUser({
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    })
  }

  function logout() {
    clearStoredSession()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
