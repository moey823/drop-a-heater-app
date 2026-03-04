// ============================================================
// GearIcon Component
// ============================================================
// Settings gear icon button for the Main View title bar.
// SVG per Brand Kit: 24px canvas, 2px stroke, round caps/joins.
// PRD ref: F9, F12

import React from 'react'
import { colors } from '../shared/design-tokens/colors'
import { spacing } from '../shared/design-tokens/spacing'

interface GearIconProps {
  onClick: () => void
}

export const GearIcon: React.FC<GearIconProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Open settings"
      tabIndex={0}
      className="titlebar-no-drag"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: spacing.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        color: colors.textSecondary,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.text
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.textSecondary
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}
