// ============================================================
// Button Component
// ============================================================
// Shared button with four variants: primary, secondary, accent, ghost.
// All styling from Brand Kit Section 09 (dark mode only).
//
// Usage:
//   <Button variant="primary" onClick={handleClick}>Drop a heater</Button>
//   <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
//   <Button variant="accent" onClick={handleRescan}>Re-scan</Button>
//   <Button variant="primary" disabled>Disabled</Button>

import React from 'react'
import { colors } from '../design-tokens/colors'
import { typeScale } from '../design-tokens/typography'
import { radii } from '../design-tokens/radii'
import { spacing } from '../design-tokens/spacing'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost'
export type ButtonSize = 'default' | 'small'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant
  /** Size */
  size?: ButtonSize
  /** Full width */
  fullWidth?: boolean
  children: React.ReactNode
}

/** Style maps for each variant */
const variantStyles: Record<ButtonVariant, {
  background: string
  color: string
  border: string
  hoverBackground: string
  hoverColor?: string
}> = {
  primary: {
    background: colors.flame,
    color: colors.white,
    border: 'transparent',
    hoverBackground: colors.flameHover,
  },
  secondary: {
    background: '#2A2A3A',
    color: colors.text,
    border: 'transparent',
    hoverBackground: '#3A3A4A',
  },
  accent: {
    background: colors.gold,
    color: colors.secondaryBg,
    border: 'transparent',
    hoverBackground: colors.goldHover,
  },
  ghost: {
    background: colors.transparent,
    color: colors.flame,
    border: colors.flame,
    hoverBackground: colors.flameMuted as string,
  },
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  disabled,
  style,
  children,
  ...props
}) => {
  const vs = variantStyles[variant]
  const isSmall = size === 'small'

  const baseStyle: React.CSSProperties = {
    ...typeScale.button,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: isSmall ? `${spacing.sm}px ${spacing.lg}px` : `${spacing.md}px 28px`,
    borderRadius: radii.full,
    border: `2px solid ${vs.border}`,
    background: vs.background,
    color: vs.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    width: fullWidth ? '100%' : undefined,
    fontSize: isSmall ? 13 : typeScale.button.fontSize,
    outline: 'none',
    ...style,
  }

  return (
    <button
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = vs.hoverBackground
          if (vs.hoverColor) e.currentTarget.style.color = vs.hoverColor
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = vs.background
        e.currentTarget.style.color = vs.color
      }}
      onFocus={(e) => {
        // Focus indicator: 2px Flame outline with 3px offset (per PRD F12)
        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.bg}, 0 0 0 5px ${colors.flame}`
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
      {...props}
    >
      {children}
    </button>
  )
}
