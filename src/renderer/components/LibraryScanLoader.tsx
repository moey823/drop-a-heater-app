// ============================================================
// LibraryScanLoader Component
// ============================================================
// Loading state for library scan (initial and re-scan).
// Shows logo with pulse glow, scanning text, and live counter.
// PRD ref: F3 (Serato Library Parsing), F8 (Library Re-scan)

import React, { useState, useEffect } from 'react'
import { Logo } from '../shared/components/Logo'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

interface LibraryScanLoaderProps {
  /** Number of tracks indexed so far */
  tracksIndexed: number
  /** Whether this is a re-scan (vs initial scan) */
  isRescan: boolean
  /** Whether the scan is complete */
  complete: boolean
}

export const LibraryScanLoader: React.FC<LibraryScanLoaderProps> = ({
  tracksIndexed,
  isRescan,
  complete,
}) => {
  const [glowPhase, setGlowPhase] = useState(0)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Pulsing glow animation for the logo
  useEffect(() => {
    if (complete || prefersReducedMotion) return
    let frame: number
    let start: number | null = null
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      setGlowPhase((Math.sin((elapsed / 1500) * Math.PI * 2) + 1) / 2)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [complete, prefersReducedMotion])

  const scanText = complete
    ? `Library loaded. ${tracksIndexed.toLocaleString()} tracks indexed.`
    : isRescan
      ? 'Re-scanning your library...'
      : 'Scanning your library...'

  const glowOpacity = !complete && !prefersReducedMotion ? 0.2 + glowPhase * 0.4 : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: spacing.xl,
      }}
      role="status"
      aria-live="assertive"
      aria-label={scanText}
    >
      <div
        style={{
          borderRadius: '50%',
          boxShadow: `0 0 ${20 + glowPhase * 40}px rgba(255, 90, 20, ${glowOpacity})`,
          transition: prefersReducedMotion ? 'none' : 'box-shadow 0.3s ease',
          lineHeight: 0,
        }}
      >
        <Logo size={80} />
      </div>

      <p style={{ ...typeScale.bodyMedium, color: colors.text }}>
        {scanText}
      </p>

      {!complete && (
        <p style={{ ...typeScale.counter, color: colors.textSecondary }}>
          {tracksIndexed.toLocaleString()} tracks indexed
        </p>
      )}
    </div>
  )
}
