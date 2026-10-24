import { useEffect, useRef } from 'react'
import Icon from './Icon'

// A reusable dialog. The parent decides WHEN to show it (by rendering it or not)
// and passes in `onClose` to hide it again.
export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null)

  // useEffect: close on Escape, move focus into the dialog, and stop the page behind from scrolling
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    // Focus the first input/button inside the dialog so keyboard users start in the right place
    const firstField = dialogRef.current.querySelector('input, select, textarea, .modal-body button')
    if (firstField) firstField.focus()

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={dialogRef}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
