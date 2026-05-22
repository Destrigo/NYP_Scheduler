import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success', duration = 3000) => {
    const id = ++nextId
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
