// ============================================================
// SubscriptionExpiry Component
// ============================================================
// Full-window overlay when subscription is expired.
// Blocks usage — the recommendation button is not visible.
// PRD ref: F2 (Subscription Validation)

import React, { useState, useCallback } from 'react'
import { Logo } from '../shared/components/Logo'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

interface SubscriptionExpiryProps {
  /** DJ's email for display */
  userEmail: string | null
  /** Opens the marketing site subscription page */
  onRenew: () => void
  /** Re-runs the subscription validation call */
  onCheckAgain: () => void
  /** Signs out the DJ */
  onSignOut: () => void
}

export const SubscriptionExpiry: React.FC<SubscriptionExpiryProps> = ({
  userEmail,
  onRenew,
  onCheckAgain,
  onSignOut,
}) => {
  const [checking, setChecking] = useState(false)

  const handleCheckAgain = useCallback(async () => {
    setChecking(true)
    await onCheckAgain()
    setChecking(false)
  }, [onCheckAgain])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        textAlign: 'center',
        gap: spacing.lg,
        padding: spacing['2xl'],
      }}
    >
      <Logo size={64} />

      <h2
        style={{
          ...typeScale.h3,
          color: colors.text,
          marginTop: spacing.lg,
        }}
      >
        Your subscription has expired.
      </h2>

      {userEmail && (
        <p style={{ ...typeScale.bodyXs, color: colors.textSecondary }}>
          {userEmail}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          marginTop: spacing.xl,
          width: '100%',
          maxWidth: 280,
        }}
      >
        <Button variant="primary" onClick={onRenew} fullWidth>
          Renew Subscription
        </Button>
        <Button
          variant="ghost"
          onClick={handleCheckAgain}
          disabled={checking}
          fullWidth
        >
          {checking ? 'Checking...' : 'Check Again'}
        </Button>
      </div>

      <button
        onClick={onSignOut}
        style={{
          background: 'none',
          border: 'none',
          color: colors.textSecondary,
          ...typeScale.bodyXs,
          cursor: 'pointer',
          marginTop: spacing['2xl'],
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
        aria-label="Sign out of DJ ID"
      >
        Sign Out
      </button>
    </div>
  )
}
