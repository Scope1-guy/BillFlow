// Label + input + error message. The input is passed in as `children`.
// The label's htmlFor must match the input's id so clicking the label focuses the input
// (and screen readers announce the label).
export default function Field({ label, id, error, hint, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  )
}
