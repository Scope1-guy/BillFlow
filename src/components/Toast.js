import { useData } from '../context/DataContext'
import Icon from './Icon'

// Small success / error message in the corner. It hides itself (see DataContext).
export default function Toast() {
  const { toast, dismissToast } = useData()
  if (!toast) return null

  return (
    <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
      <Icon name={toast.type === 'error' ? 'alert' : 'check'} size={18} />
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={dismissToast} aria-label="Dismiss message">
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
