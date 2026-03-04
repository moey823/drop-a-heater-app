// ============================================================
// Deck State Watcher
// ============================================================
// Watches Serato's session/history files to detect what track
// is currently loaded on the active deck(s).
//
// Serato writes session data to:
//   ~/Music/_Serato_/History/Sessions/   — session log files
//
// The watcher polls the latest session file for changes and
// parses the most recent track entry to determine current deck state.
//
// Detection latency target: < 2 seconds (per PRD F4).

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { Track, DeckState, LibraryIndex } from '@shared/types'
import { DECK_WATCH_INTERVAL_MS } from '@shared/constants'

type DeckStateCallback = (state: DeckState) => void

/**
 * Resolve the Serato history/sessions directory path.
 */
function resolveSessionsPath(): string {
  return path.join(os.homedir(), 'Music', '_Serato_', 'History', 'Sessions')
}

/**
 * Find the most recently modified session file in the sessions directory.
 */
function findLatestSessionFile(sessionsPath: string): string | null {
  if (!fs.existsSync(sessionsPath)) return null

  try {
    const files = fs.readdirSync(sessionsPath)
      .filter(f => f.endsWith('.session'))
      .map(f => ({
        name: f,
        path: path.join(sessionsPath, f),
        mtime: fs.statSync(path.join(sessionsPath, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime)

    return files.length > 0 ? files[0].path : null
  } catch {
    return null
  }
}

/**
 * Parse the last track entry from a Serato session file.
 * Session files use the same tagged binary format as the database.
 * Each played track is an "otrk" entry with "ptrk" (path) sub-tag.
 */
function parseLastTrackFromSession(sessionFilePath: string): string | null {
  try {
    const buffer = fs.readFileSync(sessionFilePath)
    let offset = 0
    let lastFilePath: string | null = null

    // Skip version header
    if (buffer.length >= 8 && buffer.toString('ascii', 0, 4) === 'vrsn') {
      const headerLength = buffer.readUInt32BE(4)
      offset = 8 + headerLength
    }

    // Walk all entries, keeping the last track path found
    while (offset < buffer.length - 8) {
      const tag = buffer.toString('ascii', offset, offset + 4)
      offset += 4
      const entryLength = buffer.readUInt32BE(offset)
      offset += 4

      if (tag === 'otrk') {
        // Look for ptrk sub-tag
        let subOffset = offset
        const subEnd = offset + entryLength
        while (subOffset < subEnd - 8) {
          const subTag = buffer.toString('ascii', subOffset, subOffset + 4)
          subOffset += 4
          const subLength = buffer.readUInt32BE(subOffset)
          subOffset += 4

          if (subTag === 'ptrk') {
            // Read UTF-16 BE string
            const chars: string[] = []
            for (let i = 0; i < subLength - 1; i += 2) {
              const code = (buffer[subOffset + i] << 8) | buffer[subOffset + i + 1]
              if (code === 0) break
              chars.push(String.fromCharCode(code))
            }
            const trackPath = chars.join('')
            if (trackPath) {
              lastFilePath = trackPath
            }
          }
          subOffset += subLength
        }
      }

      offset += entryLength
    }

    return lastFilePath
  } catch {
    return null
  }
}

/**
 * DeckWatcher — continuously monitors Serato session files for deck state changes.
 *
 * Usage:
 *   const watcher = new DeckWatcher(libraryIndex, onStateChange)
 *   watcher.start()
 *   // ... later ...
 *   watcher.stop()
 */
export class DeckWatcher {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastFilePath: string | null = null
  private lastSessionMtime: number = 0
  private libraryIndex: LibraryIndex | null
  private onStateChange: DeckStateCallback
  private sessionsPath: string

  constructor(libraryIndex: LibraryIndex | null, onStateChange: DeckStateCallback) {
    this.libraryIndex = libraryIndex
    this.onStateChange = onStateChange
    this.sessionsPath = resolveSessionsPath()
  }

  /**
   * Update the library index (e.g. after a re-scan).
   */
  setLibraryIndex(index: LibraryIndex): void {
    this.libraryIndex = index
  }

  /**
   * Start polling for deck state changes.
   */
  start(): void {
    if (this.intervalId) return

    // Initial check
    this.checkForChanges()

    // Poll at the configured interval
    this.intervalId = setInterval(() => {
      this.checkForChanges()
    }, DECK_WATCH_INTERVAL_MS)
  }

  /**
   * Stop polling.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Check for deck state changes by reading the latest session file.
   */
  private checkForChanges(): void {
    const sessionFile = findLatestSessionFile(this.sessionsPath)
    if (!sessionFile) {
      // No session file — Serato may not be running
      if (this.lastFilePath !== null) {
        this.lastFilePath = null
        this.onStateChange({
          track: null,
          detectedAt: Date.now(),
        })
      }
      return
    }

    // Check if the session file has been modified
    try {
      const stat = fs.statSync(sessionFile)
      if (stat.mtimeMs <= this.lastSessionMtime) return
      this.lastSessionMtime = stat.mtimeMs
    } catch {
      return
    }

    // Parse the latest track from the session file
    const currentFilePath = parseLastTrackFromSession(sessionFile)

    if (currentFilePath === this.lastFilePath) return
    this.lastFilePath = currentFilePath

    if (!currentFilePath) {
      this.onStateChange({
        track: null,
        detectedAt: Date.now(),
      })
      return
    }

    // Match against the library index
    const track = this.findTrackByPath(currentFilePath)

    this.onStateChange({
      track: track ?? null,
      detectedAt: Date.now(),
      trackNotInLibrary: !track,
    })
  }

  /**
   * Find a track in the library index by file path.
   */
  private findTrackByPath(filePath: string): Track | undefined {
    if (!this.libraryIndex) return undefined

    // Normalize path separators and try to match
    const normalized = filePath.replace(/\\/g, '/')
    return this.libraryIndex.tracks.find(t => {
      const trackNormalized = t.filePath.replace(/\\/g, '/')
      return trackNormalized === normalized || trackNormalized.endsWith(normalized) || normalized.endsWith(trackNormalized)
    })
  }
}
