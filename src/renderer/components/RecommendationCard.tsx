// ============================================================
// RecommendationCard Component
// ============================================================
// Displays the recommended track with transparency breakdown.
// Appears below the button when a result is returned.
// PRD ref: F5 (One-Button Recommendation), F7 (Transparency Display)

import React, { useEffect, useRef } from 'react'
import { Card } from '../shared/components/Card'
import { SectionLabel } from '../shared/components/SectionLabel'
import { TransparencyCard } from './TransparencyCard'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import type { Recommendation } from '../../shared/types'

interface RecommendationCardProps {
  /** The recommendation result, or null if no result / cleared */
  recommendation: Recommendation | null
  /** "No compatible tracks" state */
  noResult: boolean
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  noResult,
}) => {
  const announceRef = useRef<HTMLDivElement>(null)

  // VoiceOver announcement when a recommendation appears (per PRD F12)
  useEffect(() => {
    if (recommendation && announceRef.current) {
      const t = recommendation.transparency
      const announcement = `${recommendation.track.title} by ${recommendation.track.artist}. Key: ${t.currentKey} to ${t.recommendedKey}, ${t.keyRelationship}. BPM: ${t.currentBpm} to ${t.recommendedBpm}, ${t.bpmDeltaPercent === 0 ? 'exact match' : `${t.bpmDeltaPercent > 0 ? '+' : ''}${t.bpmDeltaPercent.toFixed(1)} percent`}. Genre: ${t.recommendedGenre || 'none'}, ${t.genreMatchType}.`
      announceRef.current.textContent = announcement
    }
  }, [recommendation])

  if (!recommendation && !noResult) return null

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Screen reader announcement */}
      <div
        ref={announceRef}
        role="status"
        aria-live="assertive"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {noResult && !recommendation && (
        <div
          style={{
            textAlign: 'center',
            padding: `${spacing['3xl']}px ${spacing.lg}px`,
          }}
        >
          <p style={{ ...typeScale.bodyMedium, color: colors.text }}>
            No compatible tracks in your library for this key and BPM range.
          </p>
        </div>
      )}

      {recommendation && (
        <Card>
          <SectionLabel style={{ marginBottom: spacing.md }}>
            RECOMMENDED TRACK
          </SectionLabel>
          <h3
            style={{
              ...typeScale.h3,
              color: colors.text,
              marginBottom: spacing.xs,
            }}
          >
            {recommendation.track.title}
          </h3>
          <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
            {recommendation.track.artist}
          </p>
          <TransparencyCard data={recommendation.transparency} />
        </Card>
      )}
    </div>
  )
}
