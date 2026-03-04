// ============================================================
// ErrorState Component
// ============================================================
// Consistent error display for all error types.
// PRD ref: E1-E8, CONVENTIONS.md Section 9

import React from 'react'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import type { AppError } from '../../shared/types'

interface ErrorStateProps {
  /** The error to display */
  error: AppError
  /** Called when the DJ clicks "Try Again" / "Retry" */
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        textAlign: 'center',
        padding: spacing['2xl'],
      }}
      role="alert"
      aria-live="assertive"
    >
      <h2
        style={{
          ...typeScale.settingsName,
          color: colors.text,
          marginBottom: spacing.sm,
        }}
      >
        {error.headline}
      </h2>
      <p
        style={{
          ...typeScale.bodyXs,
          color: colors.textSecondary,
          marginBottom: spacing['2xl'],
          maxWidth: 340,
          lineHeight: 1.6,
        }}
      >
        {error.body}
      </p>
      {error.retryable && onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
