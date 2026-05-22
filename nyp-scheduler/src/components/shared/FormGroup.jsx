export default function FormGroup({ label, required, error, children, style }) {
  return (
    <div className="form-group" style={style}>
      {label && (
        <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
