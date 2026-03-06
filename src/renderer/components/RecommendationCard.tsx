// ============================================================
// RecommendationCard Component
// ============================================================
// Displays the recommended track with transparency breakdown.
// Appears below the button when a result is returned.
// The card is draggable — drag it into a Serato deck to load.
// PRD ref: F5 (One-Button Recommendation), F7 (Transparency Display)

import React, { useEffect, useRef, useState } from 'react'
import { Card } from '../shared/components/Card'
import { SectionLabel } from '../shared/components/SectionLabel'
import { TransparencyCard } from './TransparencyCard'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { useIpc } from '../shared/hooks/useIpc'
import type { Recommendation } from '../../shared/types'

const DRAG_HINT_KEY = 'dah-drag-hint-dismissed'

interface RecommendationCardProps {
  /** The recommendation result, or null if no result / cleared */
  recommendation: Recommendation | null
  /** "No compatible tracks" state */
  noResult: boolean
}

/** Grip dots icon — 6 dots in a 2x3 grid */
const GripIcon: React.FC = () => (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="1.5" fill={colors.textSecondary} />
    <circle cx="6" cy="2" r="1.5" fill={colors.textSecondary} />
    <circle cx="2" cy="7" r="1.5" fill={colors.textSecondary} />
    <circle cx="6" cy="7" r="1.5" fill={colors.textSecondary} />
    <circle cx="2" cy="12" r="1.5" fill={colors.textSecondary} />
    <circle cx="6" cy="12" r="1.5" fill={colors.textSecondary} />
  </svg>
)

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  noResult,
}) => {
  const api = useIpc()
  const announceRef = useRef<HTMLDivElement>(null)
  const [showDragHint, setShowDragHint] = useState(
    () => !localStorage.getItem(DRAG_HINT_KEY)
  )

  // VoiceOver announcement when a recommendation appears (per PRD F12)
  useEffect(() => {
    if (recommendation && announceRef.current) {
      const t = recommendation.transparency
      const announcement = `${recommendation.track.title} by ${recommendation.track.artist}. Key: ${t.currentKey} to ${t.recommendedKey}, ${t.keyRelationship}. BPM: ${t.currentBpm} to ${t.recommendedBpm}, ${t.bpmDeltaPercent === 0 ? 'exact match' : `${t.bpmDeltaPercent > 0 ? '+' : ''}${t.bpmDeltaPercent.toFixed(1)} percent`}. Genre: ${t.recommendedGenre || 'none'}, ${t.genreMatchType}.`
      announceRef.current.textContent = announcement
    }
  }, [recommendation])

  // Drag: tell main process to start a native OS file drag.
  // We call preventDefault() to suppress the browser drag ghost, then
  // fire-and-forget to the main process which calls startDrag.
  // Also set dataTransfer as a fallback for apps that accept URI lists.
  const handleDragStart = (e: React.DragEvent) => {
    if (!recommendation) return
    const filePath = recommendation.track.filePath
    const fileUrl = 'file://' + encodeURI(filePath).replace(/%20/g, '%20')
    e.dataTransfer.setData('text/uri-list', fileUrl)
    e.dataTransfer.setData('text/plain', filePath)
    e.dataTransfer.effectAllowed = 'copy'
    // Also fire native drag via main process (for apps that need native file promises)
    api.startDrag(filePath)
    if (showDragHint) {
      localStorage.setItem(DRAG_HINT_KEY, '1')
      setShowDragHint(false)
    }
  }

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
            {/* Header row: label + grip icon */}
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
                gap: spacing.xs,
              }}>
                <span style={{
                  ...typeScale.caption,
                  color: colors.textSecondary,
                  opacity: showDragHint ? 1 : 0.6,
                }}>
                  drag to deck
                </span>
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
