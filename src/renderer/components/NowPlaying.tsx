// ============================================================
// NowPlaying Component
// ============================================================
// Shows both decks side by side. The DJ taps a deck to select it
// as the basis for the recommendation. Selected deck is highlighted.

import React from 'react'
import { SectionLabel } from '../shared/components/SectionLabel'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
import type { DeckState, DeckInfo } from '../../shared/types'

interface NowPlayingProps {
  deckState: DeckState | null
  selectedDeck: number
  onSelectDeck: (deck: number) => void
  trackInLibrary: boolean
}

interface DeckCardProps {
  deck: DeckInfo
  isSelected: boolean
  onSelect: () => void
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, isSelected, onSelect }) => {
  const hasTrack = deck.track != null

  return (
    <button
      onClick={onSelect}
      style={{
        flex: 1,
        minWidth: 0,
        padding: spacing.md,
        background: isSelected ? colors.surface : 'transparent',
        border: `1px solid ${isSelected ? colors.flame : colors.border}`,
        borderRadius: radii.md,
        cursor: 'pointer',
        textAlign: 'center',
        outline: 'none',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <p style={{
        ...typeScale.bodyXs,
        color: isSelected ? colors.flame : colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: 600,
      }}>
        DECK {deck.deckNumber}
      </p>

      {hasTrack && deck.track ? (
        <>
          <p style={{
            ...typeScale.bodySmall,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {deck.track.title}
          </p>
          <p style={{
            ...typeScale.bodyXs,
            color: colors.textSecondary,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {deck.track.artist}
          </p>
          {deck.track.camelotKey && deck.track.bpm && (
            <p style={{
              ...typeScale.dataReadout,
              color: colors.textSecondary,
              marginTop: spacing.xs,
              fontSize: 11,
            }}>
              {deck.track.camelotKey} · {deck.track.bpm} BPM
            </p>
          )}
        </>
      ) : (
        <p style={{
          ...typeScale.bodyXs,
          color: colors.textSecondary,
        }}>
          {deck.trackNotInLibrary ? 'Not in library' : 'Empty'}
        </p>
      )}
    </button>
  )
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  deckState,
  selectedDeck,
  onSelectDeck,
  trackInLibrary,
}) => {
  const decks = deckState?.decks ?? []
  const deck1 = decks.find(d => d.deckNumber === 1) ?? { deckNumber: 1, track: null }
  const deck2 = decks.find(d => d.deckNumber === 2) ?? { deckNumber: 2, track: null }
  const selectedDeckInfo = decks.find(d => d.deckNumber === selectedDeck)
  const hasAnyTrack = deck1.track != null || deck2.track != null

  return (
    <div
      style={{ textAlign: 'center', width: '100%' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <SectionLabel style={{ marginBottom: spacing.sm }}>
        NOW PLAYING
      </SectionLabel>

      {!hasAnyTrack && (
        <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
          No deck loaded. Play a track in Serato, then hit the button.
        </p>
      )}

      {hasAnyTrack && (
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          width: '100%',
        }}>
          <DeckCard
            deck={deck1}
            isSelected={selectedDeck === 1}
            onSelect={() => onSelectDeck(1)}
          />
          <DeckCard
            deck={deck2}
            isSelected={selectedDeck === 2}
            onSelect={() => onSelectDeck(2)}
          />
        </div>
      )}

      {selectedDeckInfo?.track && !trackInLibrary && (
        <p style={{
          ...typeScale.bodyXs,
          color: colors.textSecondary,
          marginTop: spacing.sm,
        }}>
          Track not in your scanned library. Re-scan to include recent additions.
        </p>
      )}
    </div>
  )
}
