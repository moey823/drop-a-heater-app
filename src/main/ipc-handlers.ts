// ============================================================
// IPC Handlers
// ============================================================
// Registers all IPC handlers that the renderer can invoke.
// Each handler maps to a channel defined in @shared/ipc-channels.

import { ipcMain, shell, BrowserWindow, nativeImage } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { IPC_INVOKE, IPC_EVENT } from '@shared/ipc-channels'
import type { LibraryIndex, DeckState, Recommendation, AuthState, SubscriptionStatus } from '@shared/types'
import { scanSeratoLibrary, SeratoNotFoundError, SeratoParseError } from './serato/library-parser'
import { DeckWatcher } from './serato/deck-watcher'
import { findRecommendation } from './matching/algorithm'
import { startOAuthFlow, handleOAuthCallback, getAuthState, clearTokens, refreshToken } from './auth/oauth'
import { validateSubscription } from './subscription/validate'

/** Module-level state */
let libraryIndex: LibraryIndex | null = null
let currentDeckState: DeckState = { decks: [{ deckNumber: 1, track: null }, { deckNumber: 2, track: null }], detectedAt: 0 }
let deckWatcher: DeckWatcher | null = null

/**
 * Get the main BrowserWindow for sending events to the renderer.
 */
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

/**
 * Send an event to the renderer process.
 */
function sendToRenderer(channel: string, data: unknown): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

/**
 * Register all IPC handlers. Call once during app initialization.
 */
export function registerIpcHandlers(): void {
  // ---- Auth ----

  ipcMain.handle(IPC_INVOKE.AUTH_SIGN_IN, async () => {
    await startOAuthFlow()
  })

  ipcMain.handle(IPC_INVOKE.AUTH_CANCEL, async () => {
    // Nothing to cancel on the main process side —
    // the browser flow is external. The renderer handles UI state.
  })

  ipcMain.handle(IPC_INVOKE.AUTH_SIGN_OUT, async () => {
    clearTokens()
    stopDeckWatcher()
    libraryIndex = null
    currentDeckState = { decks: [{ deckNumber: 1, track: null }, { deckNumber: 2, track: null }], detectedAt: 0 }
  })

  ipcMain.handle(IPC_INVOKE.AUTH_GET_STATE, (): AuthState => {
    return getAuthState()
  })

  // ---- Subscription ----

  ipcMain.handle(IPC_INVOKE.SUBSCRIPTION_VALIDATE, async (): Promise<SubscriptionStatus> => {
    return await validateSubscription()
  })

  // ---- Library ----

  ipcMain.handle(IPC_INVOKE.LIBRARY_SCAN, async () => {
    try {
      libraryIndex = await scanSeratoLibrary((tracksIndexed) => {
        sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
          tracksIndexed,
          complete: false,
        })
      })

      // Send completion event
      sendToRenderer(IPC_EVENT.LIBRARY_SCAN_PROGRESS, {
        tracksIndexed: libraryIndex.totalScanned,
        complete: true,
        libraryIndex,
      })

      // Start or update the deck watcher
      if (deckWatcher) {
        deckWatcher.setLibraryIndex(libraryIndex)
      } else {
        startDeckWatcher()
      }
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

  // ---- Recommendation ----

  ipcMain.handle(IPC_INVOKE.RECOMMENDATION_GET, (_, deckNumber: number): Recommendation | null => {
    if (!libraryIndex) return null
    const deck = currentDeckState.decks.find(d => d.deckNumber === deckNumber)
    if (!deck?.track) return null
    return findRecommendation(deck.track, libraryIndex.tracks)
  })

  // ---- Deck State ----

  ipcMain.handle(IPC_INVOKE.DECK_GET_STATE, (): DeckState => {
    return currentDeckState
  })

  // ---- Updates ----

  ipcMain.handle(IPC_INVOKE.UPDATE_CHECK, async () => {
    // Stub — electron-updater integration is handled in the main process setup.
    // The builder will wire this up with autoUpdater events.
    return { available: false }
  })

  ipcMain.handle(IPC_INVOKE.UPDATE_INSTALL, async () => {
    // Stub — builder will implement with autoUpdater.quitAndInstall()
  })

  // ---- Shell ----

  ipcMain.handle(IPC_INVOKE.SHELL_OPEN_EXTERNAL, async (_, url: string) => {
    await shell.openExternal(url)
  })

  // ---- Native Drag ----

  ipcMain.handle(IPC_INVOKE.NATIVE_DRAG, (event, filePath: string) => {
    if (!filePath || !fs.existsSync(filePath)) return { success: false }
    const iconPath = path.join(__dirname, '../../assets/icon.png')
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 })
    event.sender.startDrag({ file: filePath, icon })
    return { success: true }
  })
}

/**
 * Handle the OAuth2 callback URL (called from the custom URL scheme handler).
 */
export async function handleAuthCallback(callbackUrl: string): Promise<void> {
  try {
    const authState = await handleOAuthCallback(callbackUrl)
    sendToRenderer(IPC_EVENT.AUTH_STATE_CHANGED, authState)
  } catch (err) {
    sendToRenderer(IPC_EVENT.AUTH_STATE_CHANGED, {
      isAuthenticated: false,
      userDisplayName: null,
      userEmail: null,
      error: err instanceof Error ? err.message : 'Authentication failed',
    })
  }
}

/**
 * Start the deck state watcher.
 */
function startDeckWatcher(): void {
  deckWatcher = new DeckWatcher(libraryIndex, (state: DeckState) => {
    currentDeckState = state
    sendToRenderer(IPC_EVENT.DECK_STATE_CHANGED, state)
  })
  deckWatcher.start()
}

/**
 * Stop the deck state watcher.
 */
function stopDeckWatcher(): void {
  if (deckWatcher) {
    deckWatcher.stop()
    deckWatcher = null
  }
}

/**
 * Cleanup on app quit.
 */
export function cleanup(): void {
  stopDeckWatcher()
}
