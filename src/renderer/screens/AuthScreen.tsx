// ============================================================
// Auth Screen — Placeholder
// ============================================================
// Full-window view for DJ ID sign-in via OAuth2.
// Builder will implement: F1 (DJ ID Authentication)
//
// Layout (per PRD F1):
//   - Drop A Heater logo mark (centered)
//   - App name
//   - "Sign in with DJ ID" primary button
//   - Waiting state with "Cancel" ghost button
//   - Error state with "Try Again" button

import React from 'react'
import { ScreenWrapper } from '../shared/components/ScreenWrapper'
import { Logo } from '../shared/components/Logo'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

export const AuthScreen: React.FC = () => {
  return (
    <ScreenWrapper centered>
      <div style={{ textAlign: 'center' }}>
        <Logo size={80} style={{ marginBottom: spacing['2xl'] }} />
        <h1 style={{ ...typeScale.h2, color: colors.text, marginBottom: spacing.sm }}>
          Drop A Heater
        </h1>
        <p style={{ ...typeScale.bodySmall, color: colors.textSecondary, marginBottom: spacing['3xl'] }}>
          One button. One track. Always fire.
        </p>
        <Button variant="primary">
          Sign in with DJ ID
        </Button>
      </div>
    </ScreenWrapper>
  )
}
