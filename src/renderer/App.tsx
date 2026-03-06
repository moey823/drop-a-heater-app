// ============================================================
// App — Root Component (Full Implementation)
// ============================================================
// Manages the top-level navigation state and all app-level state.
// Two full-window states (Auth and Main) and one overlay panel (Settings).
// No router — state transitions driven by IPC events.
//
// Navigation model (per PRD IA):
//   - Auth Screen: shown when no valid DJ ID token exists
//   - Main View: home screen after auth + subscription + library scan
//   - Settings Panel: slide-over overlay on Main View
//
// State machine:
//   1. On mount: check auth state via IPC
//   2. If authenticated: validate subscription -> scan library -> show Main View
//   3. If not authenticated: show Auth Screen -> (OAuth2 flow) -> step 2
//   4. IPC events drive state updates throughout

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AuthScreen, AuthScreenState } from './screens/AuthScreen'
import { MainView } from './screens/MainView'
import { SettingsPanel } from './screens/SettingsPanel'
import { useIpc } from './shared/hooks/useIpc'
import { SCAN_COMPLETE_HOLD_MS } from '../shared/constants'
import type {
  AuthState,
  SubscriptionStatus,
  LibraryIndex,
  DeckState,
  DeckInfo,
  Recommendation,
  AppError,
  LibraryScanProgress,
} from '../shared/types'

/** The two full-window states */
type AppView = 'auth' | 'main'

export const App: React.FC = () => {
  const api = useIpc()

  // --- Navigation state ---
  const [currentView, setCurrentView] = useState<AppView>('auth')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // --- Auth state ---
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [authScreenState, setAuthScreenState] = useState<AuthScreenState>('default')
  const [authError, setAuthError] = useState<{ message: string; isNetworkError: boolean } | null>(null)

  // --- Subscription state ---
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)

  // --- Library state ---
  const [libraryIndex, setLibraryIndex] = useState<LibraryIndex | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [isRescan, setIsRescan] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)

  // --- Deck state ---
  const [deckState, setDeckState] = useState<DeckState | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<number>(1)

  // --- Error state ---
  const [appError, setAppError] = useState<AppError | null>(null)

  // --- Update state ---
  const [updateAvailable, setUpdateAvailable] = useState<{ version: string; downloading: boolean } | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [updateDismissed, setUpdateDismissed] = useState(false)

  // --- Selected deck helpers ---
  const selectedDeckInfo = useCallback((): DeckInfo | null => {
    if (!deckState) return null
    return deckState.decks.find(d => d.deckNumber === selectedDeck) ?? null
  }, [deckState, selectedDeck])

  const trackInLibrary = useCallback((): boolean => {
    const deck = selectedDeckInfo()
    if (!deck?.track || !libraryIndex) return false
    return libraryIndex.tracks.some((t) => t.id === deck.track!.id)
  }, [selectedDeckInfo, libraryIndex])

  // --- Refs ---
  const scanCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // ==========================================================
  // INITIALIZATION: Check auth state on mount
  // ==========================================================
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      try {
        const state = (await api.getAuthState()) as AuthState
        setAuthState(state)

        if (state.isAuthenticated) {
          // Already authenticated — proceed to subscription validation
          setCurrentView('main')
          await validateAndScan()
        }
        // If not authenticated, stay on auth screen
      } catch {
        // Silently stay on auth screen
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================
  // POST-AUTH FLOW: validate subscription, then scan library
  // ==========================================================
  const validateAndScan = useCallback(async () => {
    setAppError(null)

    // Step 1: Validate subscription
    try {
      const sub = (await api.validateSubscription()) as SubscriptionStatus
      setSubscriptionStatus(sub)

      if (sub.status === 'expired' || sub.status === 'not_found') {
        // Subscription expired — stop here, show expiry overlay
        return
      }
    } catch (err: unknown) {
      // Subscription validation failed
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('network') ||
          err.message.includes('ENOTFOUND') ||
          err.message.includes('fetch'))

      if (isNetworkError) {
        setAppError({
          type: 'network-error',
          headline: 'No internet connection.',
          body: 'Drop A Heater needs to verify your subscription on launch. Connect to the internet and try again.',
          retryable: true,
        })
      } else {
        setAppError({
          type: 'subscription-api-error',
          headline: 'Something went wrong.',
          body: "Couldn't check your subscription status. This is usually temporary — try again in a moment.",
          retryable: true,
        })
      }
      return
    }

    // Step 2: Scan library
    await startLibraryScan(false)

    // Step 3: Check for updates (background, non-blocking)
    try {
      await api.checkForUpdates()
    } catch {
      // Update check failures are silent
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================
  // LIBRARY SCAN
  // ==========================================================
  const startLibraryScan = useCallback(
    async (rescan: boolean) => {
      setScanning(true)
      setScanProgress(0)
      setIsRescan(rescan)
      setScanComplete(false)
      setAppError(null)

      // Close settings panel on re-scan (per PRD F8)
      if (rescan) {
        setSettingsOpen(false)
      }

      try {
        await api.scanLibrary()
      } catch (err: unknown) {
        // The error will come through the scan progress event or
        // we need to handle it here
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'

        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('ENOENT')
        ) {
          setAppError({
            type: 'serato-not-found',
            headline: 'No Serato library found.',
            body: 'Drop A Heater looks for your library at ~/Music/_Serato_/. Make sure Serato DJ is installed and has scanned your tracks at least once.',
            retryable: true,
          })
        } else {
          setAppError({
            type: 'serato-parse-error',
            headline: "Couldn't read your Serato library.",
            body: "The library files at ~/Music/_Serato_/ couldn't be parsed. This can happen with unsupported Serato versions. Make sure you're running Serato DJ Pro 3.x or later.",
            retryable: true,
          })
        }
        setScanning(false)
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ==========================================================
  // IPC EVENT LISTENERS
  // ==========================================================

  // Auth state changed (OAuth2 callback received)
  useEffect(() => {
    const unsub = api.onAuthStateChanged((data) => {
      const state = data as AuthState
      const errorMessage = (data as AuthState & { error?: string }).error
      setAuthState(state)

      if (state.isAuthenticated) {
        setAuthScreenState('loading')
        setCurrentView('main')
        validateAndScan()
      } else if (errorMessage) {
        // OAuth2 callback failed — show error on auth screen
        setCurrentView('auth')
        setAuthScreenState('error')
        setAuthError({
          message: errorMessage,
          isNetworkError: false,
        })
      } else {
        // Auth was revoked or no error context
        setCurrentView('auth')
        setAuthScreenState('default')
      }
    })
    return () => { unsub() }
  }, [validateAndScan])

  // Library scan progress
  useEffect(() => {
    const unsub = api.onLibraryScanProgress((data) => {
      const progress = data as LibraryScanProgress
      setScanProgress(progress.tracksIndexed)

      if (progress.error) {
        // Scan failed — surface the error and stop scanning
        setAppError(progress.error)
        setScanning(false)
        setScanComplete(false)
        return
      }

      if (progress.complete && progress.libraryIndex) {
        setLibraryIndex(progress.libraryIndex)
        setScanComplete(true)

        // Hold the completion message for 2 seconds (per PRD F3)
        scanCompleteTimerRef.current = setTimeout(() => {
          setScanning(false)
          setScanComplete(false)
        }, SCAN_COMPLETE_HOLD_MS)
      }
    })
    return () => {
      unsub()
      if (scanCompleteTimerRef.current) {
        clearTimeout(scanCompleteTimerRef.current)
      }
    }
  }, [])

  // Deck state changed
  useEffect(() => {
    const unsub = api.onDeckStateChanged((data) => {
      setDeckState(data as DeckState)
    })
    return () => { unsub() }
  }, [])

  // Update available
  useEffect(() => {
    const unsub = api.onUpdateAvailable((data) => {
      const info = data as { version: string; downloading: boolean }
      setUpdateAvailable(info)
      setUpdateDismissed(false)
    })
    return () => { unsub() }
  }, [])

  // Update downloaded
  useEffect(() => {
    const unsub = api.onUpdateDownloaded(() => {
      setUpdateDownloaded(true)
    })
    return () => { unsub() }
  }, [])

  // Menu: Re-scan Library (Cmd+R)
  useEffect(() => {
    const unsub = api.onMenuRescan(() => {
      if (currentView === 'main' && !scanning) {
        startLibraryScan(true)
      }
    })
    return () => { unsub() }
  }, [currentView, scanning, startLibraryScan])

  // Menu: Check for Updates
  useEffect(() => {
    const unsub = api.onMenuCheckUpdates(async () => {
      try {
        await api.checkForUpdates()
      } catch {
        // Silent failure
      }
    })
    return () => { unsub() }
  }, [])

  // ==========================================================
  // ACTION HANDLERS
  // ==========================================================

  const handleSignIn = useCallback(async () => {
    setAuthScreenState('waiting')
    setAuthError(null)
    try {
      await api.signIn()
    } catch (err: unknown) {
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('network') ||
          err.message.includes('ENOTFOUND'))

      setAuthScreenState('error')
      setAuthError({
        message: 'Sign-in failed. Check your DJ ID credentials and try again.',
        isNetworkError,
      })
    }
  }, [])

  const handleCancelSignIn = useCallback(async () => {
    await api.cancelSignIn()
    setAuthScreenState('default')
    setAuthError(null)
  }, [])

  const handleSignOut = useCallback(async () => {
    await api.signOut()
    setCurrentView('auth')
    setAuthScreenState('default')
    setAuthState(null)
    setSubscriptionStatus(null)
    setLibraryIndex(null)
    setDeckState(null)
    setAppError(null)
    setSettingsOpen(false)
    setUpdateAvailable(null)
    setUpdateDismissed(false)
    setUpdateDownloaded(false)
  }, [])

  const handleGetRecommendation = useCallback(async (): Promise<Recommendation | null> => {
    try {
      const result = (await api.getRecommendation(selectedDeck)) as Recommendation | null
      return result
    } catch {
      return null
    }
  }, [selectedDeck])

  const handleCheckSubscription = useCallback(async () => {
    try {
      const sub = (await api.validateSubscription()) as SubscriptionStatus
      setSubscriptionStatus(sub)
      if (sub.status === 'active') {
        // Subscription reactivated — proceed to scan
        await startLibraryScan(false)
      }
    } catch {
      // Silently fail — user can try again
    }
  }, [startLibraryScan])

  const handleRenewSubscription = useCallback(() => {
    api.openExternal('https://dropaheater.replit.app/subscribe')
  }, [])

  const handleRetry = useCallback(async () => {
    setAppError(null)
    if (appError?.type === 'serato-not-found' || appError?.type === 'serato-parse-error') {
      await startLibraryScan(isRescan)
    } else {
      await validateAndScan()
    }
  }, [appError, isRescan, startLibraryScan, validateAndScan])

  const handleInstallUpdate = useCallback(() => {
    api.installUpdate()
  }, [])

  const handleDismissUpdate = useCallback(() => {
    setUpdateDismissed(true)
  }, [])

  const handleCheckForUpdates = useCallback(async (): Promise<boolean> => {
    try {
      const result = (await api.checkForUpdates()) as { available: boolean }
      return result.available
    } catch {
      return false
    }
  }, [])

  const handleRescan = useCallback(() => {
    startLibraryScan(true)
  }, [startLibraryScan])

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {currentView === 'auth' && (
        <AuthScreen
          state={authScreenState}
          error={authError}
          onSignIn={handleSignIn}
          onCancel={handleCancelSignIn}
        />
      )}

      {currentView === 'main' && (
        <MainView
          authState={authState}
          subscriptionStatus={subscriptionStatus}
          libraryIndex={libraryIndex}
          deckState={deckState}
          selectedDeck={selectedDeck}
          onSelectDeck={setSelectedDeck}
          trackInLibrary={trackInLibrary()}
          appError={appError}
          scanning={scanning}
          scanProgress={scanProgress}
          isRescan={isRescan}
          scanComplete={scanComplete}
          updateAvailable={updateAvailable}
          updateDownloaded={updateDownloaded}
          updateDismissed={updateDismissed}
          onOpenSettings={() => setSettingsOpen(true)}
          onGetRecommendation={handleGetRecommendation}
          onCheckSubscription={handleCheckSubscription}
          onRenewSubscription={handleRenewSubscription}
          onSignOut={handleSignOut}
          onRetry={handleRetry}
          onInstallUpdate={handleInstallUpdate}
          onDismissUpdate={handleDismissUpdate}
          onCheckForUpdates={handleCheckForUpdates}
        />
      )}

      {currentView === 'main' && (
        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          authState={authState}
          subscriptionStatus={subscriptionStatus}
          libraryIndex={libraryIndex}
          onRescan={handleRescan}
          onSignOut={handleSignOut}
          onCheckForUpdates={handleCheckForUpdates}
          appVersion="1.0.0"
        />
      )}
    </>
  )
}
