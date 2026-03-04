// ============================================================
// Serato-Specific Types (raw parse types)
// ============================================================
// These types represent the raw data read from Serato's files
// before conversion to the app's domain types.

/**
 * Raw track metadata as read from Serato's database file.
 * Fields may be missing or empty depending on the DJ's tagging.
 */
export interface RawSeratoTrack {
  /** Full file path */
  filePath: string
  /** Track title */
  title: string
  /** Artist name */
  artist: string
  /** BPM as a string (e.g. "128.00") — needs parsing to number */
  bpm: string
  /** Musical key in whatever notation Serato stored (e.g. "Am", "8A", "C major") */
  key: string
  /** Genre string */
  genre: string
  /** List of crate names this track belongs to */
  crates: string[]
}

/**
 * A raw entry from Serato's session/history file.
 */
export interface RawSessionEntry {
  /** File path of the track loaded onto a deck */
  filePath: string
  /** Deck identifier (if available) */
  deck?: string
  /** Timestamp when the track was loaded */
  timestamp: number
}

/**
 * Serato database file header fields.
 */
export interface SeratoDatabaseHeader {
  /** File format version */
  version: string
  /** Number of track entries */
  trackCount: number
}
