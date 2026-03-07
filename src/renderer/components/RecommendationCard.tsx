// ============================================================
// RecommendationCard Component
// ============================================================
// Displays the recommended track with transparency breakdown.
// Appears below the button when a result is returned.
// The card is draggable — drag it into a Serato deck to load.
// Also has a "show in Finder" fallback button.
// PRD ref: F5 (One-Button Recommendation), F7 (Transparency Display)

import React, { useEffect, useRef, useCallback } from 'react'
import { Card } from '../shared/components/Card'
import { SectionLabel } from '../shared/components/SectionLabel'
import { TransparencyCard } from './TransparencyCard'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { useIpc } from '../shared/hooks/useIpc'
import type { Recommendation } from '../../shared/types'

interface RecommendationCardProps {
  /** The recommendation result, or null if no result / cleared */
  recommendation: Recommendation | null
  /** "No compatible tracks" state */
  noResult: boolean
  /** Show the Finder fallback button (when FDA not granted) */
  showFinder?: boolean
}

/** Finder icon — folder outline */
const FinderIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3C2 2.44772 2.44772 2 3 2H6L7.5 3.5H11C11.5523 3.5 12 3.94772 12 4.5V10C12 10.5523 11.5523 11 11 11H3C2.44772 11 2 10.5523 2 10V3Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
)

/** Grip dots icon — 6 dots in a 2x3 grid */
const GripIcon: React.FC = () => (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="6" cy="2" r="1.5" fill="currentColor" />
    <circle cx="2" cy="7" r="1.5" fill="currentColor" />
    <circle cx="6" cy="7" r="1.5" fill="currentColor" />
    <circle cx="2" cy="12" r="1.5" fill="currentColor" />
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
  </svg>
)

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  noResult,
  showFinder = true,
}) => {
  const api = useIpc()
  const announceRef = useRef<HTMLDivElement>(null)

  // VoiceOver announcement when a recommendation appears (per PRD F12)
  useEffect(() => {
    if (recommendation && announceRef.current) {
      const t = recommendation.transparency
      const announcement = `${recommendation.track.title} by ${recommendation.track.artist}. Key: ${t.currentKey} to ${t.recommendedKey}, ${t.keyRelationship}. BPM: ${t.currentBpm} to ${t.recommendedBpm}, ${t.bpmDeltaPercent === 0 ? 'exact match' : `${t.bpmDeltaPercent > 0 ? '+' : ''}${t.bpmDeltaPercent.toFixed(1)} percent`}. Genre: ${t.recommendedGenre || 'none'}, ${t.genreMatchType}.`
      announceRef.current.textContent = announcement
    }
  }, [recommendation])

  // Native drag — fire-and-forget per Electron docs
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!recommendation) return
    e.preventDefault()
    api.startDrag(recommendation.track.filePath)
  }, [recommendation, api])

  const handleShowInFinder = useCallback(() => {
    if (!recommendation) return
    api.showInFolder(recommendation.track.filePath)
  }, [recommendation, api])

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
        <div
          draggable
          onDragStart={handleDragStart}
          style={{ cursor: 'grab' }}
          aria-label={`Drag ${recommendation.track.title} by ${recommendation.track.artist} to load in Serato`}
        >
          <Card>
            {/* Header row: label + actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <SectionLabel>RECOMMENDED TRACK</SectionLabel>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                color: colors.textSecondary,
              }}>
                {/* Show in Finder button — only when FDA not granted */}
                {showFinder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShowInFinder()
                    }}
                    aria-label={`Show ${recommendation.track.title} in Finder`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      padding: '3px 7px',
                      cursor: 'pointer',
                      color: 'inherit',
                      ...typeScale.caption,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.flame
                      e.currentTarget.style.color = colors.text
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.color = colors.textSecondary
                    }}
                  >
                    <FinderIcon />
                    Finder
                  </button>
                )}
                {/* Drag grip */}
                <GripIcon />
              </div>
            </div>
            <h3
              style={{
                ...typeScale.h3,
                color: colors.text,
                marginBottom: spacing.xs,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {recommendation.track.title}
            </h3>
            <p style={{
              ...typeScale.bodySmall,
              color: colors.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {recommendation.track.artist}
            </p>
            <TransparencyCard data={recommendation.transparency} />
          </Card>
        </div>
      )}
    </div>
  )
}
