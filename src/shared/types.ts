// ============================================================
// Drop A Heater — Core Domain Types
// ============================================================

/**
 * All 24 valid Camelot keys.
 * Number (1-12) + Letter (A = minor, B = major).
 */
export type CamelotKey =
  | '1A' | '2A' | '3A' | '4A' | '5A' | '6A'
  | '7A' | '8A' | '9A' | '10A' | '11A' | '12A'
  | '1B' | '2B' | '3B' | '4B' | '5B' | '6B'
  | '7B' | '8B' | '9B' | '10B' | '11B' | '12B'

/**
 * A track from the DJ's Serato library.
 * Parsed from ~/Music/_Serato_/ database files.
 */
export interface Track {
  /** Unique identifier (file path hash or Serato internal ID) */
  id: string
  /** Track title */
  title: string
  /** Artist name */
  artist: string
  /** BPM as a floating-point number. Null if missing from metadata. */
  bpm: number | null
  /** Musical key in Camelot notation. Null if missing or unconvertible. */
  camelotKey: CamelotKey | null
  /** Genre string (case-preserved from Serato). Null if missing. */
  genre: string | null
  /** Crate memberships (list of crate names) */
  crates: string[]
  /** Full file path to the audio file */
  filePath: string
  /** Position in the library index (Serato's native ordering). Used for tie-breaking. */
  indexPosition: number
}

/**
 * The current deck state — what track is loaded on the active deck(s).
 */
export interface DeckState {
  /** The currently playing/loaded track, or null if no deck is loaded */
  track: Track | null
  /** When this deck state was detected */
  detectedAt: number
}

/**
 * Key compatibility relationship between two Camelot keys.
 */
export type KeyRelationship =
  | 'same key'
  | '+1 on Camelot'
  | '-1 on Camelot'
  | 'relative major'
  | 'relative minor'

/**
 * Genre match classification.
 */
export type GenreMatchType =
  | 'same genre'
  | 'adjacent'
  | 'different genre'
  | 'no genre'

/**
 * Transparency data for a recommendation — the "show the math" breakdown.
 */
export interface TransparencyData {
  /** Current track's Camelot key */
  currentKey: CamelotKey
  /** Recommended track's Camelot key */
  recommendedKey: CamelotKey
  /** How the keys relate on the Camelot wheel */
  keyRelationship: KeyRelationship
  /** Current track's BPM */
  currentBpm: number
  /** Recommended track's BPM */
  recommendedBpm: number
  /** Absolute BPM difference */
  bpmDelta: number
  /** BPM difference as a percentage (signed, e.g. -1.6) */
  bpmDeltaPercent: number
  /** Recommended track's genre */
  recommendedGenre: string | null
  /** Current track's genre */
  currentGenre: string | null
  /** Genre match classification */
  genreMatchType: GenreMatchType
  /** The adjacent genre name, if genreMatchType is 'adjacent' */
  adjacentGenreName?: string
}

/**
 * A complete recommendation result.
 */
export interface Recommendation {
  /** The recommended track */
  track: Track
  /** Transparency breakdown */
  transparency: TransparencyData
  /** Composite score (0.0 to 1.0) */
  compositeScore: number
}

/**
 * Library index — the in-memory representation of the DJ's Serato library.
 * Created on launch. Destroyed on quit.
 */
export interface LibraryIndex {
  /** All tracks with complete metadata (BPM + key present) */
  tracks: Track[]
  /** Total tracks scanned (including excluded) */
  totalScanned: number
  /** Number of tracks excluded due to missing BPM or key */
  excludedCount: number
  /** Timestamp of when the scan completed */
  scannedAt: number
}

/**
 * Subscription validation result from the marketing site API.
 */
export interface SubscriptionStatus {
  status: 'active' | 'expired' | 'not_found'
  expiresAt: string | null
}

/**
 * Authentication state.
 */
export interface AuthState {
  isAuthenticated: boolean
  userDisplayName: string | null
  userEmail: string | null
}

/**
 * Library scan progress event (pushed from main to renderer).
 */
export interface LibraryScanProgress {
  /** Number of tracks indexed so far */
  tracksIndexed: number
  /** Whether the scan is complete */
  complete: boolean
  /** Final library index (only present when complete === true) */
  libraryIndex?: LibraryIndex
}

/**
 * App-level error that the renderer should display.
 */
export interface AppError {
  /** Error type identifier */
  type:
    | 'serato-not-found'
    | 'serato-parse-error'
    | 'network-error'
    | 'subscription-api-error'
    | 'auth-error'
    | 'unknown'
  /** User-facing headline */
  headline: string
  /** User-facing body text */
  body: string
  /** Whether a "Try Again" / "Retry" action is available */
  retryable: boolean
}
