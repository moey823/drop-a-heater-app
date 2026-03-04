// ============================================================
// Matching Algorithm
// ============================================================
// The core recommendation engine. Scores every eligible track
// in the library against the currently playing track using three
// factors: Camelot key compatibility, BPM proximity, and genre match.
//
// Per PRD F6:
//   - Key compatibility is pass/fail (hard filter).
//   - BPM ±5% is pass/fail (hard filter).
//   - BPM proximity score: weight 0.7
//   - Genre score: weight 0.3
//   - Tie-break: library index order (lower indexPosition wins).

import type { Track, Recommendation, TransparencyData, CamelotKey } from '@shared/types'
import { ALGORITHM } from '@shared/constants'
import { getCamelotRelationship, areCamelotCompatible } from '../serato/camelot'
import { getGenreMatchType } from './genre-adjacency'

/**
 * Run the matching algorithm against the full library.
 *
 * @param currentTrack — the track currently playing on the deck
 * @param library — all eligible tracks in the library index
 * @returns The single best recommendation, or null if no candidates pass the hard filters.
 */
export function findRecommendation(
  currentTrack: Track,
  library: Track[]
): Recommendation | null {
  if (!currentTrack.camelotKey || !currentTrack.bpm) return null

  const currentKey = currentTrack.camelotKey
  const currentBpm = currentTrack.bpm
  const currentGenre = currentTrack.genre

  // Calculate BPM range (±5%)
  const bpmLow = currentBpm * (1 - ALGORITHM.bpmMaxDeviation)
  const bpmHigh = currentBpm * (1 + ALGORITHM.bpmMaxDeviation)

  let bestCandidate: { track: Track; score: number; transparency: TransparencyData } | null = null

  for (const candidate of library) {
    // Skip the currently playing track
    if (candidate.id === currentTrack.id) continue

    // Hard filter: must have key and BPM
    if (!candidate.camelotKey || !candidate.bpm) continue

    // Hard filter: Camelot key compatibility
    if (!areCamelotCompatible(currentKey, candidate.camelotKey)) continue

    // Hard filter: BPM within ±5%
    if (candidate.bpm < bpmLow || candidate.bpm > bpmHigh) continue

    // ---- Scoring (among passing candidates) ----

    // BPM proximity score: linear from 1.0 (exact match) to 0.0 (at ±5% boundary)
    const bpmDelta = Math.abs(currentBpm - candidate.bpm)
    const maxDelta = currentBpm * ALGORITHM.bpmMaxDeviation
    const bpmScore = maxDelta > 0 ? 1.0 - (bpmDelta / maxDelta) : 1.0

    // Genre score
    const { matchType: genreMatchType, adjacentGenreName } = getGenreMatchType(
      currentGenre,
      candidate.genre
    )
    let genreScore: number
    switch (genreMatchType) {
      case 'same genre':
        genreScore = 1.0
        break
      case 'adjacent':
        genreScore = 0.5
        break
      case 'different genre':
      case 'no genre':
      default:
        genreScore = 0.0
        break
    }

    // Composite score
    const compositeScore = (bpmScore * ALGORITHM.bpmWeight) + (genreScore * ALGORITHM.genreWeight)

    // Check if this is the best candidate so far
    if (
      !bestCandidate ||
      compositeScore > bestCandidate.score ||
      (compositeScore === bestCandidate.score && candidate.indexPosition < bestCandidate.track.indexPosition)
    ) {
      // Build transparency data
      const keyRelationship = getCamelotRelationship(currentKey, candidate.camelotKey)!
      const bpmDeltaRaw = candidate.bpm - currentBpm
      const bpmDeltaPercent = (bpmDeltaRaw / currentBpm) * 100

      const transparency: TransparencyData = {
        currentKey,
        recommendedKey: candidate.camelotKey,
        keyRelationship,
        currentBpm,
        recommendedBpm: candidate.bpm,
        bpmDelta: Math.abs(bpmDeltaRaw),
        bpmDeltaPercent: parseFloat(bpmDeltaPercent.toFixed(1)),
        recommendedGenre: candidate.genre,
        currentGenre,
        genreMatchType,
        ...(adjacentGenreName ? { adjacentGenreName } : {}),
      }

      bestCandidate = {
        track: candidate,
        score: compositeScore,
        transparency,
      }
    }
  }

  if (!bestCandidate) return null

  return {
    track: bestCandidate.track,
    transparency: bestCandidate.transparency,
    compositeScore: parseFloat(bestCandidate.score.toFixed(4)),
  }
}
