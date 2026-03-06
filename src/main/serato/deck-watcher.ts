// ============================================================
// Deck State Watcher
// ============================================================
// Polls Serato DJ's SQLite database to detect what tracks are
// loaded on each deck. Uses the history_entry table in
// ~/Library/Application Support/Serato/Library/master.sqlite
//
// Active tracks have end_time = -1. The deck column tells us
// which physical deck (1 = left, 2 = right) the track is on.
//
// Uses the sqlite3 CLI to avoid native module issues with Electron.
//
// Detection latency target: < 2 seconds (per PRD F4).

import { execFile } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import type { Track, DeckState, DeckInfo, LibraryIndex } from '@shared/types'
import { DECK_WATCH_INTERVAL_MS } from '@shared/constants'

type DeckStateCallback = (state: DeckState) => void

/**
 * Resolve the Serato master.sqlite path.
 */
function resolveDbPath(): string {
  return path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Serato',
    'Library',
    'master.sqlite'
  )
}

interface HistoryRow {
  portable_id: string
  deck: string
}

const QUERY = `
SELECT a.portable_id, he.deck
FROM history_entry he
LEFT JOIN asset a ON he.asset_id = a.id
WHERE he.end_time = -1
ORDER BY he.start_time DESC;
`

/**
 * Run a query against the Serato SQLite database using the sqlite3 CLI.
 */
function queryDb(dbPath: string): Promise<HistoryRow[]> {
  return new Promise((resolve) => {
    execFile(
      '/usr/bin/sqlite3',
      ['-json', '-readonly', dbPath, QUERY],
      { timeout: 3000 },
      (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve([])
          return
        }
        try {
          const rows = JSON.parse(stdout) as HistoryRow[]
          resolve(rows)
        } catch {
          resolve([])
        }
      }
    )
  })
}

/**
 * DeckWatcher — polls Serato's SQLite database for deck state.
 */
export class DeckWatcher {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastDeck1Path: string | null = null
  private lastDeck2Path: string | null = null
  private libraryIndex: LibraryIndex | null
  private onStateChange: DeckStateCallback
  private dbPath: string

  constructor(libraryIndex: LibraryIndex | null, onStateChange: DeckStateCallback) {
    this.libraryIndex = libraryIndex
    this.onStateChange = onStateChange
    this.dbPath = resolveDbPath()
  }

  setLibraryIndex(index: LibraryIndex): void {
    this.libraryIndex = index
  }

  start(): void {
    if (this.intervalId) return
    this.checkForChanges()
    this.intervalId = setInterval(() => {
      this.checkForChanges()
    }, DECK_WATCH_INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async checkForChanges(): Promise<void> {
    const rows = await queryDb(this.dbPath)

    const deck1Row = rows.find(r => r.deck === '1') ?? null
    const deck2Row = rows.find(r => r.deck === '2') ?? null

    const deck1Path = deck1Row?.portable_id ?? null
    const deck2Path = deck2Row?.portable_id ?? null

    // Only emit if something changed
    if (deck1Path === this.lastDeck1Path && deck2Path === this.lastDeck2Path) return
    this.lastDeck1Path = deck1Path
    this.lastDeck2Path = deck2Path

    const decks: DeckInfo[] = [
      this.buildDeckInfo(1, deck1Row),
      this.buildDeckInfo(2, deck2Row),
    ]

    this.onStateChange({ decks, detectedAt: Date.now() })
  }

  private buildDeckInfo(deckNumber: number, row: HistoryRow | null): DeckInfo {
    if (!row || !row.portable_id) {
      return { deckNumber, track: null }
    }

    // Normalize portable_id to absolute path for matching
    let filePath = row.portable_id
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath
    }

    const track = this.findTrackByPath(filePath)

    if (track) {
      return { deckNumber, track }
    }

    return {
      deckNumber,
      track: null,
      trackNotInLibrary: true,
    }
  }

  private findTrackByPath(filePath: string): Track | undefined {
    if (!this.libraryIndex) return undefined

    const normalized = filePath.replace(/\\/g, '/')
    return this.libraryIndex.tracks.find(t => {
      const trackNormalized = t.filePath.replace(/\\/g, '/')
      return trackNormalized === normalized ||
        trackNormalized.endsWith(normalized) ||
        normalized.endsWith(trackNormalized)
    })
  }
}
