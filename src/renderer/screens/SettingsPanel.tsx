// ============================================================
// Settings Panel — Placeholder
// ============================================================
// Slide-over panel from right edge (360px wide).
// Builder will implement: F9 (Settings Panel)
//
// Layout (per PRD F9):
//   - Close button (X) top-right
//   - ACCOUNT section: display name, email, subscription badge
//   - LIBRARY section: tracks indexed, excluded count, last scan, re-scan button
//   - ABOUT section: version, check for updates link
//   - Sign Out ghost button at bottom
//
// The panel overlays the Main View with a semi-transparent scrim.

import React from 'react'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
import { SectionLabel } from '../shared/components/SectionLabel'
import { SETTINGS_PANEL_WIDTH } from '@shared/constants'

export interface SettingsPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean
  /** Callback to close the panel */
  onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <>
      {/* Scrim overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Settings"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: SETTINGS_PANEL_WIDTH,
          background: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
          borderTopLeftRadius: radii.xl,
          borderBottomLeftRadius: radii.xl,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          padding: spacing['2xl'],
          paddingTop: spacing['5xl'],
          overflow: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{
            position: 'absolute',
            top: spacing.lg,
            right: spacing.lg,
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: spacing.sm,
          }}
        >
          &times;
        </button>

        {/* Account section — placeholder */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>Account</SectionLabel>
        <p style={{ ...typeScale.settingsName, color: colors.text, marginBottom: spacing.xs }}>
          DJ Name
        </p>
        <p style={{ ...typeScale.bodyXs, color: colors.textSecondary, marginBottom: spacing['2xl'] }}>
          dj@example.com
        </p>

        {/* Library section — placeholder */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>Library</SectionLabel>
        <p style={{ ...typeScale.bodySmall, color: colors.text, marginBottom: spacing.sm }}>
          Tracks indexed: —
        </p>
        <p style={{ ...typeScale.bodyXs, color: colors.textSecondary, marginBottom: spacing['2xl'] }}>
          Last scanned: —
        </p>

        {/* About section — placeholder */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>About</SectionLabel>
        <p style={{ ...typeScale.bodyXs, color: colors.text }}>
          Drop A Heater v1.0.0
        </p>
      </div>
    </>
  )
}
