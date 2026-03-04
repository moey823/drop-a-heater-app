// ============================================================
// Auth Screen — Full Implementation
// ============================================================
// Full-window view for DJ ID sign-in via OAuth2.
// PRD ref: F1 (DJ ID Authentication), E6 (Auth Failure)
//
// States:
//   - Default: Logo + "Sign in with DJ ID" button
//   - Waiting: "Waiting for sign-in..." + Cancel button
//   - Error: Error message + "Try Again" button
//   - Loading: Post-auth, validating subscription

import React from 'react'
import { ScreenWrapper } from '../shared/components/ScreenWrapper'
import { Logo } from '../shared/components/Logo'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

export type AuthScreenState = 'default' | 'waiting' | 'error' | 'loading'

interface AuthScreenError {
  message: string
  isNetworkError: boolean
}

export interface AuthScreenProps {
  /** Current state of the auth screen */
  state: AuthScreenState
  /** Error details (when state === 'error') */
  error?: AuthScreenError | null
  /** Called when the DJ clicks "Sign in with DJ ID" or "Try Again" */
  onSignIn: () => void
  /** Called when the DJ clicks "Cancel" during waiting state */
  onCancel: () => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  state,
  error,
  onSignIn,
  onCancel,
}) => {
  return (
    <ScreenWrapper centered>
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 340,
        }}
      >
        <Logo size={80} style={{ marginBottom: spacing['2xl'] }} />

        <h1
          style={{
            ...typeScale.h2,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          Drop A Heater
        </h1>

        <p
          style={{
            ...typeScale.bodySmall,
            color: colors.textSecondary,
            marginBottom: spacing['3xl'],
          }}
        >
          One button. One track. Always fire.
        </p>

        {/* Default state: Sign in button */}
        {state === 'default' && (
          <Button
            variant="primary"
            onClick={onSignIn}
            aria-label="Sign in with DJ ID"
          >
            Sign in with DJ ID
          </Button>
        )}

        {/* Waiting state: Waiting text + Cancel */}
        {state === 'waiting' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.lg,
            }}
          >
            <p
              style={{
                ...typeScale.bodySmall,
                color: colors.textSecondary,
              }}
              role="status"
              aria-live="polite"
            >
              Waiting for sign-in...
            </p>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}

        {/* Error state: Error message + Try Again */}
        {state === 'error' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.lg,
            }}
          >
            <p
              style={{
                ...typeScale.bodySmall,
                color: colors.error,
              }}
              role="alert"
              aria-live="assertive"
            >
              {error?.isNetworkError
                ? "Couldn't reach DJ ID. Check your internet connection and try again."
                : error?.message ||
                  'Sign-in failed. Check your DJ ID credentials and try again.'}
            </p>
            <Button variant="primary" onClick={onSignIn}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading state: Post-auth, validating */}
        {state === 'loading' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.lg,
            }}
          >
            <p
              style={{
                ...typeScale.bodySmall,
                color: colors.textSecondary,
              }}
              role="status"
              aria-live="polite"
            >
              Signing in...
            </p>
          </div>
        )}
      </div>
    </ScreenWrapper>
  )
}
