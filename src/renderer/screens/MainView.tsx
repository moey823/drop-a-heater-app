// ============================================================
// Main View — Placeholder
// ============================================================
// Full-window view (home screen). The core interaction surface.
// Builder will implement: F3-F8 (Library, Deck State, Recommendation,
// Algorithm results display, Transparency, Re-scan)
//
// Layout (per PRD IA):
//   - Title bar area with gear icon (opens Settings)
//   - Now Playing section (deck state)
//   - DROP A HEATER button (centered, prominent)
//   - Recommendation Card + Transparency Display (below button)
//   - Update banner (top, when available)

import React from 'react'
import { ScreenWrapper } from '../shared/components/ScreenWrapper'
import { SectionLabel } from '../shared/components/SectionLabel'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

export const MainView: React.FC = () => {
  return (
    <ScreenWrapper>
      {/* Title bar area — gear icon goes here (builder) */}
      <div
        className="titlebar-drag-region"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: `${spacing.sm}px 0`,
        }}
      >
        {/* Gear icon button — builder will implement */}
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing['2xl'],
        }}
      >
        {/* Now Playing section — placeholder */}
        <div style={{ textAlign: 'center' }}>
          <SectionLabel style={{ marginBottom: spacing.sm }}>
            NOW PLAYING
          </SectionLabel>
          <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
            No deck loaded. Play a track in Serato, then hit the button.
          </p>
        </div>

        {/* DROP A HEATER button — placeholder */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: colors.flame,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          <span
            style={{
              ...typeScale.buttonLarge,
              color: colors.white,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            DROP A{'\n'}HEATER
          </span>
        </div>

        {/* Recommendation Card area — builder will implement */}
      </div>
    </ScreenWrapper>
  )
}
