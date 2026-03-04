// ============================================================
// Card Component
// ============================================================
// Content card wrapper matching Brand Kit Section 09 (dark mode).
// Background: #1E1E2A, border: 1px solid #2A2A3A, border-radius: 10px.
//
// Usage:
//   <Card>
//     <SectionLabel>RECOMMENDED TRACK</SectionLabel>
//     <h3>Track Name</h3>
//   </Card>

import React from 'react'
import { colors } from '../design-tokens/colors'
import { radii } from '../design-tokens/radii'
import { spacing } from '../design-tokens/spacing'

export interface CardProps {
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Optional click handler */
  onClick?: () => void
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ style, onClick, children }) => {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        padding: `${spacing['2xl']}px 28px`,
        color: colors.text,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
