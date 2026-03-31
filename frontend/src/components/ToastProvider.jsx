import { useMemo, useState } from 'react'
import './Toast.css'

import { ToastContext } from './toastContext.js'

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now()) + String(Math.random()).slice(2)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const value = useMemo(() => {
    return {
      pushToast: ({ type = 'success', message }) => {
        const id = safeId()
        setToasts((prev) => [...prev, { id, type, message }])
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3500)
      },
    }
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

