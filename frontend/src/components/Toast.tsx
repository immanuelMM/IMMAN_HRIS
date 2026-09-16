import { useEffect } from 'react'
import type { FeedbackTone } from '../utils/attendanceFeedback'

export function Toast({
  message,
  tone,
  onDismiss,
}: {
  message: string
  tone: FeedbackTone
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3200)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`attendance-toast attendance-toast-${tone}`} role="status">
      {message}
    </div>
  )
}
