// ============================================================
// Serato Library Parser
// ============================================================
// Reads track metadata from ~/Music/_Serato_/ database files.
// Serato stores its library in a binary format in the "database V2" file.
// The format uses tagged data chunks (similar to ID3 tags).
//
// Reference: Community-documented Serato file format.
// Key files:
//   ~/Music/_Serato_/database V2    — main track database
//   ~/Music/_Serato_/Subcrates/     — crate membership files
//
// This parser reads the database, extracts track metadata, and converts
// keys to Camelot notation. Tracks missing BPM or key are flagged
// but still returned (the caller decides what to exclude).

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { Track, LibraryIndex, CamelotKey } from '@shared/types'
import type { RawSeratoTrack } from './types'
import { toCamelotKey } from './camelot'

/** Resolve the Serato library path (expand ~) */
function resolveSeratoPath(): string {
  return path.join(os.homedir(), 'Music', '_Serato_')
}

/**
 * Read a UTF-16BE encoded string from a buffer at a given offset.
 * Serato stores most string fields as UTF-16 Big Endian.
 */
function readUtf16BE(buffer: Buffer, offset: number, length: number): string {
  const bytes = buffer.subarray(offset, offset + length)
  // Convert UTF-16 BE to string
  const chars: string[] = []
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1]
    if (code === 0) break
    chars.push(String.fromCharCode(code))
  }
  return chars.join('')
}

/**
 * Parse a single track entry from the Serato database buffer.
 * Each track entry starts with "otrk" (track object) tag.
 *
 * Track entries contain sub-tags:
 *   ptrk — file path
 *   tsng — song title
 *   tart — artist
 *   tbpm — BPM
 *   tkey — musical key
 *   tgen — genre
 *
 * Each sub-tag format: 4-byte tag name (ASCII) + 4-byte length (big-endian uint32) + data
 */
function parseTrackEntry(buffer: Buffer, startOffset: number, entryLength: number): RawSeratoTrack {
  const track: RawSeratoTrack = {
    filePath: '',
    title: '',
    artist: '',
    bpm: '',
    key: '',
    genre: '',
    crates: [],
  }

  let offset = startOffset
  const endOffset = startOffset + entryLength

  while (offset < endOffset - 8) {
    // Read tag name (4 bytes ASCII)
    const tag = buffer.toString('ascii', offset, offset + 4)
    offset += 4

    // Read data length (4 bytes big-endian uint32)
    const dataLength = buffer.readUInt32BE(offset)
    offset += 4

    if (offset + dataLength > endOffset) break

    // Parse known tags
    switch (tag) {
      case 'ptrk':
        track.filePath = readUtf16BE(buffer, offset, dataLength)
        break
      case 'tsng':
        track.title = readUtf16BE(buffer, offset, dataLength)
        break
      case 'tart':
        track.artist = readUtf16BE(buffer, offset, dataLength)
        break
      case 'tbpm':
        track.bpm = readUtf16BE(buffer, offset, dataLength)
        break
      case 'tkey':
        track.key = readUtf16BE(buffer, offset, dataLength)
        break
      case 'tgen':
        track.genre = readUtf16BE(buffer, offset, dataLength)
        break
      // Other tags (talb, tcom, etc.) are ignored — not needed for matching
    }

    offset += dataLength
  }

  return track
}

/**
 * Parse the Serato "database V2" file and extract all track entries.
 */
function parseDatabaseFile(filePath: string): RawSeratoTrack[] {
  const buffer = fs.readFileSync(filePath)
  const tracks: RawSeratoTrack[] = []

  // The file starts with a "vrsn" header tag
  let offset = 0

  // Skip the version header
  if (buffer.toString('ascii', 0, 4) === 'vrsn') {
    const headerLength = buffer.readUInt32BE(4)
    offset = 8 + headerLength
  }

  // Parse track entries (each starts with "otrk")
  while (offset < buffer.length - 8) {
    const tag = buffer.toString('ascii', offset, offset + 4)
    offset += 4

    const entryLength = buffer.readUInt32BE(offset)
    offset += 4

    if (tag === 'otrk') {
      try {
        const track = parseTrackEntry(buffer, offset, entryLength)
        if (track.filePath || track.title) {
          tracks.push(track)
        }
      } catch {
        // Skip malformed entries silently (per PRD: errors on individual tracks are silently skipped)
      }
    }

    offset += entryLength
  }

  return tracks
}

/**
 * Parse crate files from ~/Music/_Serato_/Subcrates/ to build
 * a mapping of file paths to crate names.
 */
function parseCrateMemberships(seratoPath: string): Map<string, string[]> {
  const crateMap = new Map<string, string[]>()
  const subcratesDir = path.join(seratoPath, 'Subcrates')

  if (!fs.existsSync(subcratesDir)) return crateMap

  try {
    const crateFiles = fs.readdirSync(subcratesDir).filter(f => f.endsWith('.crate'))

    for (const crateFile of crateFiles) {
      const crateName = crateFile.replace('.crate', '')
      const crateFilePath = path.join(subcratesDir, crateFile)

      try {
        const buffer = fs.readFileSync(crateFilePath)
        let offset = 0

        // Skip version header
        if (buffer.toString('ascii', 0, 4) === 'vrsn') {
          const headerLength = buffer.readUInt32BE(4)
          offset = 8 + headerLength
        }

        // Parse track references (otrk tags containing ptrk sub-tags)
        while (offset < buffer.length - 8) {
          const tag = buffer.toString('ascii', offset, offset + 4)
          offset += 4
          const entryLength = buffer.readUInt32BE(offset)
          offset += 4

          if (tag === 'otrk') {
            // Look for ptrk within this entry
            let subOffset = offset
            const subEnd = offset + entryLength
            while (subOffset < subEnd - 8) {
              const subTag = buffer.toString('ascii', subOffset, subOffset + 4)
              subOffset += 4
              const subLength = buffer.readUInt32BE(subOffset)
              subOffset += 4

              if (subTag === 'ptrk') {
                const trackPath = readUtf16BE(buffer, subOffset, subLength)
                if (trackPath) {
                  const existing = crateMap.get(trackPath) || []
                  existing.push(crateName)
                  crateMap.set(trackPath, existing)
                }
              }
              subOffset += subLength
            }
          }

          offset += entryLength
        }
      } catch {
        // Skip malformed crate files silently
      }
    }
  } catch {
    // Subcrates directory read error — non-fatal
  }

  return crateMap
}

/**
 * Convert a RawSeratoTrack to the app's Track type.
 */
function convertToTrack(raw: RawSeratoTrack, indexPosition: number): Track {
  // Parse BPM
  let bpm: number | null = null
  if (raw.bpm && raw.bpm.trim() !== '') {
    const parsed = parseFloat(raw.bpm)
    if (!isNaN(parsed) && parsed > 0) {
      bpm = parsed
    }
  }

  // Convert key to Camelot notation
  let camelotKey: CamelotKey | null = null
  if (raw.key && raw.key.trim() !== '') {
    camelotKey = toCamelotKey(raw.key)
  }

  // Genre — keep as-is (case preserved), null if empty
  const genre = raw.genre && raw.genre.trim() !== '' ? raw.genre.trim() : null

  // Generate a stable ID from the file path
  const id = Buffer.from(raw.filePath).toString('base64url')

  return {
    id,
    title: raw.title || path.basename(raw.filePath, path.extname(raw.filePath)),
    artist: raw.artist || 'Unknown Artist',
    bpm,
    camelotKey,
    genre,
    crates: raw.crates,
    filePath: raw.filePath,
    indexPosition,
  }
}

/**
 * Scan the Serato library and build a LibraryIndex.
 *
 * @param onProgress — callback with the current count of tracks indexed (for live counter)
 * @returns LibraryIndex with eligible tracks and stats
 * @throws Error if the Serato library directory doesn't exist or the database can't be read
 */
export async function scanSeratoLibrary(
  onProgress?: (tracksIndexed: number) => void
): Promise<LibraryIndex> {
  const seratoPath = resolveSeratoPath()

  // Check if Serato directory exists
  if (!fs.existsSync(seratoPath)) {
    throw new SeratoNotFoundError(seratoPath)
  }

  // Check for database file
  const databasePath = path.join(seratoPath, 'database V2')
  if (!fs.existsSync(databasePath)) {
    throw new SeratoNotFoundError(seratoPath)
  }

  // Parse the database
  let rawTracks: RawSeratoTrack[]
  try {
    rawTracks = parseDatabaseFile(databasePath)
  } catch (err) {
    throw new SeratoParseError(
      err instanceof Error ? err.message : 'Unknown parse error'
    )
  }

  // Parse crate memberships
  const crateMap = parseCrateMemberships(seratoPath)

  // Convert to Track objects
  const allTracks: Track[] = []
  const eligibleTracks: Track[] = []
  let excludedCount = 0

  for (let i = 0; i < rawTracks.length; i++) {
    const raw = rawTracks[i]

    // Apply crate memberships
    if (crateMap.has(raw.filePath)) {
      raw.crates = crateMap.get(raw.filePath)!
    }

    const track = convertToTrack(raw, i)
    allTracks.push(track)

    // Eligible = has both BPM and key
    if (track.bpm !== null && track.camelotKey !== null) {
      eligibleTracks.push(track)
    } else {
      excludedCount++
    }

    // Report progress periodically
    if (onProgress && (i % 50 === 0 || i === rawTracks.length - 1)) {
      onProgress(i + 1)
    }
  }

  return {
    tracks: eligibleTracks,
    totalScanned: allTracks.length,
    excludedCount,
    scannedAt: Date.now(),
  }
}

/**
 * Error thrown when the Serato library directory is not found.
 */
export class SeratoNotFoundError extends Error {
  constructor(public readonly searchPath: string) {
    super(`No Serato library found at ${searchPath}`)
    this.name = 'SeratoNotFoundError'
  }
}

/**
 * Error thrown when the Serato database file cannot be parsed.
 */
export class SeratoParseError extends Error {
  constructor(public readonly reason: string) {
    super(`Couldn't read Serato library: ${reason}`)
    this.name = 'SeratoParseError'
  }
}
