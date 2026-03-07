// ============================================================
// TransparencyCard Component
// ============================================================
// Shows the "show the math" breakdown for a recommendation.
// Three lines: Key relationship, BPM delta, Genre match.
// PRD ref: F7 (Transparency Display)

import React from 'react'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
import { BPM_WARNING_THRESHOLD_PERCENT } from '../../shared/constants'
import type { TransparencyData } from '../../shared/types'

interface TransparencyCardProps {
  data: TransparencyData
}

/** Get the color for a BPM delta indicator */
function getBpmColor(deltaPercent: number): string {
  if (deltaPercent === 0) return colors.success
  if (Math.abs(deltaPercent) <= BPM_WARNING_THRESHOLD_PERCENT) return colors.success
  return colors.warning
}

/** Get the color for a genre match indicator */
function getGenreColor(matchType: TransparencyData['genreMatchType']): string {
  switch (matchType) {
    case 'same genre':
      return colors.success
    case 'adjacent':
      return colors.warning
    case 'different genre':
    case 'no genre':
      return colors.textSecondary
  }
}

/** Format the BPM delta display string */
function formatBpmDelta(deltaPercent: number): string {
  if (deltaPercent === 0) return '(exact match)'
  const sign = deltaPercent > 0 ? '+' : ''
  return `(${sign}${deltaPercent.toFixed(1)}%)`
}

/** Format the genre match display string */
function formatGenreMatch(data: TransparencyData): string {
  switch (data.genreMatchType) {
    case 'same genre':
      return '(same genre)'
    case 'adjacent':
      return `(adjacent: ${data.currentGenre})`
    case 'different genre':
      return '(different genre)'
    case 'no genre':
      return '(no genre)'
  }
}

export const TransparencyCard: React.FC<TransparencyCardProps> = ({ data }) => {
  const lineStyle: React.CSSProperties = {
    ...typeScale.dataReadout,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  }

  const labelStyle: React.CSSProperties = {
    color: colors.textSecondary,
  }

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: radii.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        marginTop: spacing.lg,
      }}
      aria-label={`Recommendation reasoning: Key ${data.currentKey} to ${data.recommendedKey}, ${data.keyRelationship}. BPM ${data.currentBpm} to ${data.recommendedBpm}, ${formatBpmDelta(data.bpmDeltaPercent)}. Genre: ${data.recommendedGenre || 'none'}, ${formatGenreMatch(data)}.`}
    >
      {/* Key line */}
      <div style={lineStyle}>
        <span>
          <span style={labelStyle}>Key: </span>
          <span style={{ color: colors.text }}>
            {data.currentKey} {'\u2192'} {data.recommendedKey}
          </span>{' '}
          <span style={{ color: colors.success }}>
            ({data.keyRelationship})
          </span>
        </span>
        <span style={{ color: colors.success }}>{'\u2713'}</span>
      </div>

      {/* BPM line */}
      <div style={lineStyle}>
        <span>
          <span style={labelStyle}>BPM: </span>
          <span style={{ color: colors.text }}>
            {data.currentBpm} {'\u2192'} {data.recommendedBpm}
          </span>{' '}
          <span style={{ color: getBpmColor(data.bpmDeltaPercent) }}>
            {formatBpmDelta(data.bpmDeltaPercent)}
          </span>
        </span>
        <span style={{ color: getBpmColor(data.bpmDeltaPercent) }}>{'\u2713'}</span>
      </div>

      {/* Genre line */}
      <div style={lineStyle}>
        <span>
          <span style={labelStyle}>Genre: </span>
          <span style={{ color: colors.text }}>
            {data.recommendedGenre || '—'}
          </span>{' '}
          <span style={{ color: getGenreColor(data.genreMatchType) }}>
            {formatGenreMatch(data)}
          </span>
        </span>
        <span style={{ color: getGenreColor(data.genreMatchType) }}>
          {data.genreMatchType === 'same genre' || data.genreMatchType === 'adjacent'
            ? '\u2713'
            : '—'}
        </span>
      </div>
    </div>
  )
}
