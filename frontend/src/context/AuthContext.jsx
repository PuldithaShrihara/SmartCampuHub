import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredUser, getToken, logout as clearStoredSession, saveSession } from '../api/auth.js'
import { getMe } from '../api/meApi.js'
import { applyTheme } from '../utils/theme.js'
import { AuthContext } from './authContextObject.js'

const PREFS_STORAGE_KEY = 'smart_campus_prefs'

function readStoredPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredPrefs(prefs) {
  try {
    if (prefs) {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
    } else {
      localStorage.removeItem(PREFS_STORAGE_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [preferences, setPreferences] = useState(() => readStoredPrefs())

  const refreshMe = useCallback(async () => {
    if (!getToken()) return null
    try {
      const me = await getMe()
      setUser((prev) => ({
        ...(prev || {}),
        email: me?.email ?? prev?.email,
        fullName: me?.fullName ?? prev?.fullName,
        role: me?.role ?? prev?.role,
        avatarUrl: me?.avatarUrl ?? prev?.avatarUrl,
      }))
      const prefs = me?.preferences || null
      setPreferences(prefs)
      writeStoredPrefs(prefs)
      if (prefs?.theme) {
        applyTheme(prefs.theme)
      }
      return me
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  function login(authResponse) {
    saveSession(authResponse)
    setUser({
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    })
    refreshMe()
  }

  function logout() {
    clearStoredSession()
    writeStoredPrefs(null)
    setUser(null)
    setPreferences(null)
  }

  function setLocalPreferences(next) {
    setPreferences(next)
    writeStoredPrefs(next)
    if (next?.theme) {
      applyTheme(next.theme)
    }
  }

  const value = useMemo(
    () => ({
      user,
      preferences,
      login,
      logout,
      refreshMe,
      setPreferences: setLocalPreferences,
    }),
    [user, preferences, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
