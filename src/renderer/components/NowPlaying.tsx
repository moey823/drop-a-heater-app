// ============================================================
// NowPlaying Component
// ============================================================
// Displays the current deck state — what track is loaded on
// the active deck. Shows idle state when no deck is loaded.
// PRD ref: F4 (Deck State Detection), E5, E10

import React from 'react'
import { SectionLabel } from '../shared/components/SectionLabel'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import type { DeckState } from '../../shared/types'

interface NowPlayingProps {
  /** Current deck state from IPC */
  deckState: DeckState | null
  /** Whether the track on deck is in the library index */
  trackInLibrary: boolean
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  deckState,
  trackInLibrary,
}) => {
  const hasTrack = deckState?.track != null
  const isTrackNotInLibrary = !hasTrack && !!deckState?.trackNotInLibrary

  return (
    <div
      style={{ textAlign: 'center', width: '100%' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <SectionLabel style={{ marginBottom: spacing.sm }}>
        NOW PLAYING
      </SectionLabel>

      {!hasTrack && !isTrackNotInLibrary && (
        <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
          No deck loaded. Play a track in Serato, then hit the button.
        </p>
      )}

      {isTrackNotInLibrary && (
        <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
          Track not in your scanned library. Re-scan to include recent
          additions.
        </p>
      )}

      {hasTrack && deckState?.track && (
        <div>
          <p style={{ ...typeScale.subtitle, color: colors.text }}>
            {deckState.track.title}
          </p>
          <p
            style={{
              ...typeScale.bodyXs,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {deckState.track.artist}
          </p>
          {deckState.track.camelotKey && deckState.track.bpm && (
            <p
              style={{
                ...typeScale.dataReadout,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              {deckState.track.camelotKey} &middot; {deckState.track.bpm} BPM
            </p>
          )}
          {!trackInLibrary && (
            <p
              style={{
                ...typeScale.bodyXs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Track not in your scanned library. Re-scan to include recent
              additions.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
