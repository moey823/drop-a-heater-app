// ============================================================
// ScreenWrapper Component
// ============================================================
// Full-window layout wrapper. Provides consistent background color,
// safe area padding (for macOS title bar), and centered content layout.
//
// Usage:
//   <ScreenWrapper>
//     <div>Screen content here</div>
//   </ScreenWrapper>

import React from 'react'
import { colors } from '../design-tokens/colors'
import { spacing } from '../design-tokens/spacing'

export interface ScreenWrapperProps {
  /** Additional inline styles on the outer container */
  style?: React.CSSProperties
  /** Center content both vertically and horizontally (for Auth Screen) */
  centered?: boolean
  children: React.ReactNode
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  style,
  centered = false,
  children,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: colors.bg,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Draggable title bar region for macOS hiddenInset */}
      <div
        className="titlebar-drag-region"
        style={{ height: 28, flexShrink: 0 }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: centered ? 'center' : 'stretch',
          justifyContent: centered ? 'center' : 'flex-start',
          padding: `${spacing.lg}px ${spacing['2xl']}px ${spacing['2xl']}px`,
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
