// ============================================================
// Toast Component
// ============================================================
// Brief notification that appears at the bottom of the screen
// and auto-dismisses. Used for "You're on the latest version" etc.
//
// Usage:
//   <Toast message="You're on the latest version." visible={showToast} />

import React, { useEffect } from 'react'
import { colors } from '../design-tokens/colors'
import { typeScale } from '../design-tokens/typography'
import { radii } from '../design-tokens/radii'
import { spacing } from '../design-tokens/spacing'

export interface ToastProps {
  /** Toast message text */
  message: string
  /** Whether the toast is visible */
  visible: boolean
  /** Auto-dismiss duration in ms (default 3000) */
  duration?: number
  /** Callback when the toast should be hidden */
  onDismiss: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  duration = 3000,
  onDismiss,
}) => {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [visible, duration, onDismiss])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: spacing['3xl'],
        left: '50%',
        transform: 'translateX(-50%)',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        padding: `${spacing.md}px ${spacing.xl}px`,
        ...typeScale.bodySmall,
        color: colors.text,
        zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {message}
    </div>
  )
}
