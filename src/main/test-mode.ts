// ============================================================
// Test Mode — Mock Auth/Subscription, Real Serato (TEST_MODE=1)
// ============================================================
// Bypasses DJ ID auth and subscription validation but uses the
// real Serato library scanner and deck watcher.
//
// Usage: TEST_MODE=1 npm run dev
// To remove: delete this file and the `if` blocks in index.ts

import { ipcMain, shell, BrowserWindow, nativeImage, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { IPC_INVOKE, IPC_EVENT, IPC_SEND } from '@shared/ipc-channels'
import type { LibraryIndex, DeckState, Recommendation, AuthState, SubscriptionStatus } from '@shared/types'
import { scanSeratoLibrary, SeratoNotFoundError, SeratoParseError } from './serato/library-parser'
import { DeckWatcher } from './serato/deck-watcher'
import { findRecommendation } from './matching/algorithm'

export const isTestMode = !!process.env.TEST_MODE

// ---- Mock Data (auth + subscription only) ----

const MOCK_AUTH: AuthState = {
  isAuthenticated: true,
  userDisplayName: 'Test DJ',
  userEmail: 'test@dropaheater.com',
}

const MOCK_SUBSCRIPTION: SubscriptionStatus = {
  status: 'active',
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
}

// ---- Module State ----

let libraryIndex: LibraryIndex | null = null
let currentDeckState: DeckState = { decks: [{ deckNumber: 1, track: null }, { deckNumber: 2, track: null }], detectedAt: 0 }
let deckWatcher: DeckWatcher | null = null
let libraryWatcher: fs.FSWatcher | null = null
let libraryChangeDebounce: ReturnType<typeof setTimeout> | null = null

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

function sendToRenderer(channel: string, data: unknown): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

function startDeckWatcher(): void {
  deckWatcher = new DeckWatcher(libraryIndex, (state: DeckState) => {
    currentDeckState = state
    sendToRenderer(IPC_EVENT.DECK_STATE_CHANGED, state)
  })
  deckWatcher.start()
}

function stopDeckWatcher(): void {
  if (deckWatcher) {
    deckWatcher.stop()
    deckWatcher = null
  }
}

function startLibraryWatcher(): void {
  stopLibraryWatcher()
  const dbPath = path.join(os.homedir(), 'Music', '_Serato_', 'database V2')
  if (!fs.existsSync(dbPath)) return
  try {
    libraryWatcher = fs.watch(dbPath, () => {
      if (libraryChangeDebounce) clearTimeout(libraryChangeDebounce)
      libraryChangeDebounce = setTimeout(() => {
        sendToRenderer(IPC_EVENT.LIBRARY_CHANGED, {})
      }, 3000)
    })
  } catch {
    // Non-fatal
  }
}

function stopLibraryWatcher(): void {
  if (libraryWatcher) {
    libraryWatcher.close()
    libraryWatcher = null
  }
  if (libraryChangeDebounce) {
    clearTimeout(libraryChangeDebounce)
    libraryChangeDebounce = null
  }
}

/**
 * Register test-mode IPC handlers. Mock auth/subscription, real Serato.
 */
export function registerTestModeHandlers(): void {
  console.log('[TEST MODE] Mock auth + subscription, real Serato library + deck watcher')

  // ---- Auth (always authenticated) ----

  ipcMain.handle(IPC_INVOKE.AUTH_SIGN_IN, async () => {
    sendToRenderer(IPC_EVENT.AUTH_STATE_CHANGED, MOCK_AUTH)
  })

  ipcMain.handle(IPC_INVOKE.AUTH_CANCEL, async () => {})

  ipcMain.handle(IPC_INVOKE.AUTH_SIGN_OUT, async () => {
    stopDeckWatcher()
    libraryIndex = null
    currentDeckState = { decks: [{ deckNumber: 1, track: null }, { deckNumber: 2, track: null }], detectedAt: 0 }
  })

  ipcMain.handle(IPC_INVOKE.AUTH_GET_STATE, (): AuthState => {
    return MOCK_AUTH
  })

  // ---- Subscription (always active) ----

  ipcMain.handle(IPC_INVOKE.SUBSCRIPTION_VALIDATE, async (): Promise<SubscriptionStatus> => {
    return MOCK_SUBSCRIPTION
  })

  // ---- Library (real Serato scan) ----

  ipcMain.handle(IPC_INVOKE.LIBRARY_SCAN, async () => {
    try {
      libraryIndex = await scanSeratoLibrary((tracksIndexed) => {
        sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
          tracksIndexed,
          complete: false,
        })
      })

      sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
        tracksIndexed: libraryIndex.totalScanned,
        complete: true,
        libraryIndex,
      })

      if (deckWatcher) {
        deckWatcher.setLibraryIndex(libraryIndex)
      } else {
        startDeckWatcher()
      }

      startLibraryWatcher()
    } catch (err) {
      if (err instanceof SeratoNotFoundError) {
        sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
          tracksIndexed: 0,
          complete: true,
          error: {
            type: 'serato-not-found',
            headline: 'No Serato library found.',
            body: "Drop A Heater looks for your library at ~/Music/_Serato_/. Make sure Serato DJ is installed and has scanned your tracks at least once.",
            retryable: true,
          },
        })
      } else if (err instanceof SeratoParseError) {
        sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
          tracksIndexed: 0,
          complete: true,
          error: {
            type: 'serato-parse-error',
            headline: "Couldn't read your Serato library.",
            body: "The library files at ~/Music/_Serato_/ couldn't be parsed. This can happen with unsupported Serato versions. Make sure you're running Serato DJ Pro 3.x or later.",
            retryable: true,
          },
        })
      } else {
        throw err
      }
    }
  })

  ipcMain.handle(IPC_INVOKE.LIBRARY_GET_INDEX, (): LibraryIndex | null => {
    return libraryIndex
  })

  // ---- Recommendation (real algorithm, real data) ----

  ipcMain.handle(IPC_INVOKE.RECOMMENDATION_GET, (_, deckNumber: number): Recommendation | null => {
    if (!libraryIndex) return null
    const deck = currentDeckState.decks.find(d => d.deckNumber === deckNumber)
    if (!deck?.track) return null
    return findRecommendation(deck.track, libraryIndex.tracks)
  })

  // ---- Deck State (real watcher) ----

  ipcMain.handle(IPC_INVOKE.DECK_GET_STATE, (): DeckState => {
    return currentDeckState
  })

  // ---- Updates (no-op) ----

  ipcMain.handle(IPC_INVOKE.UPDATE_CHECK, async () => {
    return { available: false }
  })

  ipcMain.handle(IPC_INVOKE.UPDATE_INSTALL, async () => {})

  // ---- Shell ----

  ipcMain.handle(IPC_INVOKE.SHELL_OPEN_EXTERNAL, async (_, url: string) => {
    await shell.openExternal(url)
  })

  // ---- Native Drag (fire-and-forget, must be synchronous for OS drag) ----

  let dragIcon: Electron.NativeImage | null = null
  try {
    const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png')
    if (fs.existsSync(iconPath)) {
      dragIcon = nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 })
    }
  } catch {
    // Fall through
  }
  if (!dragIcon || dragIcon.isEmpty()) {
    dragIcon = nativeImage.createFromBuffer(
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4jWP8z8Dwn4EIwMQwSjBoDABhNMoGDRcNAHRHAhBTnov0AAAAAElFTkSuQmCC', 'base64')
    )
  }

  ipcMain.on(IPC_SEND.NATIVE_DRAG, (event, filePath: string) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return
      event.sender.startDrag({ file: filePath, icon: dragIcon! })
    } catch (err) {
      console.error('[drag] startDrag failed:', err)
    }
  })
}

export function cleanupTestMode(): void {
  stopDeckWatcher()
  stopLibraryWatcher()
}
