// ============================================================
// HeaterButton Component
// ============================================================
// The core recommendation button — "DROP A HEATER".
// Large, circular, prominent. Three visual states: ready, disabled, processing.
// PRD ref: F5 (One-Button Recommendation), F12 (Accessibility)

import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'

interface HeaterButtonProps {
  /** Whether the button is enabled */
  enabled: boolean
  /** Called when the DJ presses the button */
  onPress: () => void
  /** Reason the button is disabled (for aria-label) */
  disabledReason?: string
}

export const HeaterButton: React.FC<HeaterButtonProps> = ({
  enabled,
  onPress,
  disabledReason,
}) => {
  const [pressing, setPressing] = useState(false)
  const [glowPhase, setGlowPhase] = useState(0)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Idle glow animation for enabled state
  useEffect(() => {
    if (!enabled || prefersReducedMotion) return
    let frame: number
    let start: number | null = null
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      // 2-second cycle
      setGlowPhase((Math.sin((elapsed / 2000) * Math.PI * 2) + 1) / 2)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [enabled, prefersReducedMotion])

  const handleClick = useCallback(() => {
    if (!enabled) return
    setPressing(true)
    onPress()
    // Brief press animation
    setTimeout(() => setPressing(false), 150)
  }, [enabled, onPress])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const glowOpacity = enabled && !prefersReducedMotion ? 0.15 + glowPhase * 0.25 : 0
  const scale = pressing && !prefersReducedMotion ? 0.95 : 1

  const ariaLabel = enabled
    ? 'Drop a heater. Press to get a track recommendation.'
    : `Drop a heater. Disabled. ${disabledReason || 'No deck loaded.'}`

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!enabled}
      aria-label={ariaLabel}
      tabIndex={0}
      style={{
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: colors.flame,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.5,
        border: 'none',
        transform: `scale(${scale})`,
        transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease',
        boxShadow: enabled
          ? `0 0 ${20 + glowPhase * 30}px rgba(255, 90, 20, ${glowOpacity})`
          : 'none',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          ...typeScale.buttonLarge,
          color: colors.white,
          textAlign: 'center',
          lineHeight: 1.3,
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
        }}
      >
        {'DROP A\nHEATER'}
      </span>
    </button>
  )
}
