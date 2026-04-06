import { createContext, useContext } from 'react'

/** Resolved Google OAuth Web client ID (may be empty). */
export const GoogleClientIdContext = createContext('')

export function useGoogleClientId() {
  return useContext(GoogleClientIdContext)
}
