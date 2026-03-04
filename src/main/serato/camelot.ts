// ============================================================
// Camelot Key System
// ============================================================
// The Camelot wheel is a circular arrangement of musical keys used by DJs.
// Number (1-12) represents position on the wheel. Letter: A = minor, B = major.
// Compatible keys: same key, +1 position, -1 position, relative major/minor.

import type { CamelotKey, KeyRelationship } from '@shared/types'

/**
 * All valid Camelot keys.
 */
export const ALL_CAMELOT_KEYS: CamelotKey[] = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B',
]

/**
 * Parse a Camelot key string into its number and letter components.
 */
function parseCamelotKey(key: CamelotKey): { number: number; letter: 'A' | 'B' } {
  const letter = key.slice(-1) as 'A' | 'B'
  const number = parseInt(key.slice(0, -1), 10)
  return { number, letter }
}

/**
 * Wrap a Camelot position number to stay within 1-12.
 */
function wrapPosition(n: number): number {
  return ((n - 1 + 12) % 12) + 1
}

/**
 * Check if two Camelot keys are compatible and return the relationship.
 * Returns null if keys are not compatible.
 */
export function getCamelotRelationship(
  current: CamelotKey,
  candidate: CamelotKey
): KeyRelationship | null {
  const c = parseCamelotKey(current)
  const d = parseCamelotKey(candidate)

  // Same key
  if (c.number === d.number && c.letter === d.letter) {
    return 'same key'
  }

  // Relative major/minor (same number, different letter)
  if (c.number === d.number && c.letter !== d.letter) {
    return c.letter === 'A' ? 'relative major' : 'relative minor'
  }

  // +1 or -1 on the wheel (same letter)
  if (c.letter === d.letter) {
    const plus1 = wrapPosition(c.number + 1)
    const minus1 = wrapPosition(c.number - 1)

    if (d.number === plus1) return '+1 on Camelot'
    if (d.number === minus1) return '-1 on Camelot'
  }

  return null
}

/**
 * Check if two Camelot keys are compatible (any valid relationship).
 */
export function areCamelotCompatible(current: CamelotKey, candidate: CamelotKey): boolean {
  return getCamelotRelationship(current, candidate) !== null
}

/**
 * Map from standard musical key notation to Camelot notation.
 * Covers common formats found in Serato metadata.
 */
const MUSICAL_KEY_TO_CAMELOT: Record<string, CamelotKey> = {
  // Minor keys (A suffix in Camelot)
  'ab minor': '1A', 'g# minor': '1A',
  'eb minor': '2A', 'd# minor': '2A',
  'bb minor': '3A', 'a# minor': '3A',
  'f minor': '4A',
  'c minor': '5A',
  'g minor': '6A',
  'd minor': '7A',
  'a minor': '8A',
  'e minor': '9A',
  'b minor': '10A',
  'f# minor': '11A', 'gb minor': '11A',
  'c# minor': '12A', 'db minor': '12A',

  // Major keys (B suffix in Camelot)
  'b major': '1B', 'cb major': '1B',
  'f# major': '2B', 'gb major': '2B',
  'c# major': '3B', 'db major': '3B',
  'ab major': '4B', 'g# major': '4B',
  'eb major': '5B', 'd# major': '5B',
  'bb major': '6B', 'a# major': '6B',
  'f major': '7B',
  'c major': '8B',
  'g major': '9B',
  'd major': '10B',
  'a major': '11B',
  'e major': '12B',
}

/**
 * Serato sometimes stores keys in short format (e.g. "Am", "Cmaj", "F#m").
 * This maps those to the full notation used in MUSICAL_KEY_TO_CAMELOT.
 */
function normalizeKeyNotation(raw: string): string {
  let s = raw.trim()

  // Already in Camelot notation? (e.g. "8A", "12B")
  const camelotMatch = s.match(/^(\d{1,2})([AB])$/i)
  if (camelotMatch) {
    return s.toUpperCase()
  }

  // Short notation: "Am", "Bbm", "F#m", "Cmaj", "Dbmaj"
  const shortMatch = s.match(/^([A-Ga-g][#b]?)(m|min|maj|major|minor)?$/i)
  if (shortMatch) {
    const note = shortMatch[1]
    const quality = shortMatch[2]?.toLowerCase() || ''

    const isMinor = quality === 'm' || quality === 'min' || quality === 'minor'
    const isMajor = quality === 'maj' || quality === 'major' || quality === ''

    // Default to major if no quality specified (standard music theory convention)
    if (isMinor) {
      return `${note.toLowerCase()} minor`
    } else if (isMajor) {
      return `${note.toLowerCase()} major`
    }
  }

  // "Open Key" notation (e.g. "1d", "8m") — less common but some Serato plugins use it
  const openKeyMatch = s.match(/^(\d{1,2})([dm])$/i)
  if (openKeyMatch) {
    const num = parseInt(openKeyMatch[1], 10)
    const letter = openKeyMatch[2].toLowerCase()
    // Open Key to Camelot: same numbers, d=major(B), m=minor(A)
    if (num >= 1 && num <= 12) {
      return `${num}${letter === 'd' ? 'B' : 'A'}`
    }
  }

  return s.toLowerCase()
}

/**
 * Convert a raw key string (from Serato metadata) to Camelot notation.
 * Returns null if the key cannot be converted.
 */
export function toCamelotKey(rawKey: string): CamelotKey | null {
  if (!rawKey || rawKey.trim() === '') return null

  const normalized = normalizeKeyNotation(rawKey)

  // Check if it's already a valid Camelot key
  if (ALL_CAMELOT_KEYS.includes(normalized as CamelotKey)) {
    return normalized as CamelotKey
  }

  // Look up in the musical key mapping
  return MUSICAL_KEY_TO_CAMELOT[normalized] ?? null
}
