// ============================================================
// SectionLabel Component
// ============================================================
// Renders labels like "RECOMMENDED TRACK", "NOW PLAYING", "ACCOUNT", etc.
// IBM Plex Mono 600, 11px, uppercase, letter-spacing 2px, Flame color.
// Per Brand Kit Section 06 (Label / Overline).
//
// Usage:
//   <SectionLabel>RECOMMENDED TRACK</SectionLabel>
//   <SectionLabel color={colors.gold}>LIBRARY</SectionLabel>

import React from 'react'
import { colors } from '../design-tokens/colors'
import { typeScale } from '../design-tokens/typography'

export interface SectionLabelProps {
  /** Override the default Flame color */
  color?: string
  /** Additional styles */
  style?: React.CSSProperties
  children: React.ReactNode
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  color = colors.flame,
  style,
  children,
}) => {
  return (
    <div
      style={{
        ...typeScale.label,
        color,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
