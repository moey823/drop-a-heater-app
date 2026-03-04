// ============================================================
// Genre Adjacency Table
// ============================================================
// Defines which genres are considered "adjacent" for the matching algorithm.
// All comparisons are bidirectional and case-insensitive.
// Per PRD F6: genre matching is exact string match (after case normalization).

import type { GenreMatchType } from '@shared/types'

/**
 * The adjacency table from the PRD. Each pair is bidirectional.
 */
const ADJACENCY_PAIRS: [string, string][] = [
  ['tech house', 'deep house'],
  ['tech house', 'techno'],
  ['tech house', 'house'],
  ['deep house', 'house'],
  ['house', 'disco'],
  ['techno', 'industrial techno'],
  ['techno', 'minimal'],
  ['drum & bass', 'jungle'],
  ['drum & bass', 'breakbeat'],
  ['hip hop', 'r&b'],
  ['hip hop', 'trap'],
  ['trap', 'grime'],
  ['reggaeton', 'latin house'],
  ['afrobeats', 'amapiano'],
  ['trance', 'progressive trance'],
  ['progressive house', 'melodic house'],
  ['edm', 'electro house'],
  ['dubstep', 'riddim'],
]

/**
 * Pre-built adjacency map for O(1) lookup.
 * Keys are lowercased genre names, values are sets of adjacent genre names (also lowercased).
 */
const adjacencyMap: Map<string, Set<string>> = new Map()

// Build the map from the pairs table
for (const [a, b] of ADJACENCY_PAIRS) {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()

  if (!adjacencyMap.has(aLower)) adjacencyMap.set(aLower, new Set())
  if (!adjacencyMap.has(bLower)) adjacencyMap.set(bLower, new Set())

  adjacencyMap.get(aLower)!.add(bLower)
  adjacencyMap.get(bLower)!.add(aLower)
}

/**
 * Check if two genres are adjacent (bidirectional).
 */
export function areGenresAdjacent(genreA: string, genreB: string): boolean {
  const aLower = genreA.toLowerCase()
  const bLower = genreB.toLowerCase()

  return adjacencyMap.get(aLower)?.has(bLower) ?? false
}

/**
 * Determine the genre match type between a current genre and a candidate genre.
 *
 * @returns The match type and an optional adjacent genre name for display.
 */
export function getGenreMatchType(
  currentGenre: string | null,
  candidateGenre: string | null
): { matchType: GenreMatchType; adjacentGenreName?: string } {
  // Missing genre on either side
  if (!currentGenre || !candidateGenre) {
    return { matchType: 'no genre' }
  }

  // Case-insensitive exact match
  if (currentGenre.toLowerCase() === candidateGenre.toLowerCase()) {
    return { matchType: 'same genre' }
  }

  // Check adjacency
  if (areGenresAdjacent(currentGenre, candidateGenre)) {
    return { matchType: 'adjacent', adjacentGenreName: currentGenre }
  }

  return { matchType: 'different genre' }
}
