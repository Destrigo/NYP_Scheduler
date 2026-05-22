import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ConfirmCtx = createContext(null)
export const useConfirm = () => useContext(ConfirmCtx)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((message, opts = {}) => {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setDialog({ message, confirmLabel: opts.confirmLabel || 'Confirm', danger: opts.danger || false })
    })
  }, [])

  function respond(result) {
    setDialog(null)
    resolveRef.current?.(result)
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="modal-overlay" onClick={() => respond(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: '28px 24px 20px' }}>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>{dialog.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => respond(false)}>Cancel</button>
              <button
                className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => respond(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}
