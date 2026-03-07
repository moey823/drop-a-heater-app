// ============================================================
// Main View — Full Implementation
// ============================================================
// Full-window view (home screen). The core interaction surface.
// PRD ref: F2-F8, F10, E1-E5, E7-E10
//
// States:
//   - Scanning: Library scan in progress (initial or re-scan)
//   - ScanComplete: Brief "Library loaded" message before ready
//   - Error: Serato not found / parse error / network error
//   - SubscriptionExpired: Expiry overlay blocks usage
//   - Ready: Idle, waiting for deck load or button press
//   - Recommendation: Result displayed

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ScreenWrapper } from '../shared/components/ScreenWrapper'
import { Toast } from '../shared/components/Toast'
import { NowPlaying } from '../components/NowPlaying'
import { HeaterButton } from '../components/HeaterButton'
import { RecommendationCard } from '../components/RecommendationCard'
import { LibraryScanLoader } from '../components/LibraryScanLoader'
import { SubscriptionExpiry } from '../components/SubscriptionExpiry'
import { UpdateBanner } from '../components/UpdateBanner'
import { FileAccessBanner } from '../components/FileAccessBanner'
import { ErrorState } from '../components/ErrorState'
import { GearIcon } from '../components/GearIcon'
import { useIpc } from '../shared/hooks/useIpc'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import type {
  DeckState,
  LibraryIndex,
  Recommendation,
  SubscriptionStatus,
  AppError,
  AuthState,
} from '../../shared/types'

/** Main View state machine */
type MainViewState =
  | 'scanning'
  | 'scan-complete'
  | 'ready'
  | 'error'
  | 'subscription-expired'

interface MainViewProps {
  /** Current auth state */
  authState: AuthState | null
  /** Current subscription status */
  subscriptionStatus: SubscriptionStatus | null
  /** Current library index */
  libraryIndex: LibraryIndex | null
  /** Current deck state */
  deckState: DeckState | null
  /** Currently selected deck number */
  selectedDeck: number
  /** Callback to select a deck */
  onSelectDeck: (deck: number) => void
  /** Whether the track on deck is found in the library index */
  trackInLibrary: boolean
  /** Current app error (if any) */
  appError: AppError | null
  /** Whether a library scan is in progress */
  scanning: boolean
  /** Number of tracks indexed so far during scan */
  scanProgress: number
  /** Whether this is a re-scan */
  isRescan: boolean
  /** Whether scan just completed */
  scanComplete: boolean
  /** Update info */
  updateAvailable: { version: string; downloading: boolean } | null
  /** Whether update has been downloaded */
  updateDownloaded: boolean
  /** Whether the update banner was dismissed */
  updateDismissed: boolean
  /** Open settings panel */
  onOpenSettings: () => void
  /** Request a recommendation */
  onGetRecommendation: () => Promise<Recommendation | null>
  /** Re-validate subscription */
  onCheckSubscription: () => Promise<void>
  /** Renew subscription (open browser) */
  onRenewSubscription: () => void
  /** Sign out */
  onSignOut: () => void
  /** Retry (for error states) */
  onRetry: () => void
  /** Install update */
  onInstallUpdate: () => void
  /** Dismiss update banner */
  onDismissUpdate: () => void
  /** Check for updates (from settings) */
  onCheckForUpdates: () => Promise<boolean>
}

export const MainView: React.FC<MainViewProps> = ({
  authState,
  subscriptionStatus,
  libraryIndex,
  deckState,
  selectedDeck,
  onSelectDeck,
  trackInLibrary,
  appError,
  scanning,
  scanProgress,
  isRescan,
  scanComplete,
  updateAvailable,
  updateDownloaded,
  updateDismissed,
  onOpenSettings,
  onGetRecommendation,
  onCheckSubscription,
  onRenewSubscription,
  onSignOut,
  onRetry,
  onInstallUpdate,
  onDismissUpdate,
  onCheckForUpdates,
}) => {
  const api = useIpc()
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [noResult, setNoResult] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const prevDeckTrackId = useRef<string | null>(null)

  // File access state — check once on mount
  const [hasFileAccess, setHasFileAccess] = useState(true)
  const [fileAccessDismissed, setFileAccessDismissed] = useState(false)

  useEffect(() => {
    const check = () => api.checkFileAccess().then((result: unknown) => setHasFileAccess(result as boolean))
    check()
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Determine the current view state
  const getViewState = (): MainViewState => {
    if (appError) return 'error'
    if (subscriptionStatus?.status === 'expired' || subscriptionStatus?.status === 'not_found') {
      return 'subscription-expired'
    }
    if (scanning) return 'scanning'
    if (scanComplete) return 'scan-complete'
    return 'ready'
  }

  const viewState = getViewState()

  // Selected deck info
  const selectedDeckInfo = deckState?.decks.find(d => d.deckNumber === selectedDeck) ?? null

  // Clear recommendation when selected deck's track changes (per PRD F5)
  useEffect(() => {
    const currentTrackId = selectedDeckInfo?.track?.id ?? null
    if (prevDeckTrackId.current !== null && currentTrackId !== prevDeckTrackId.current) {
      setRecommendation(null)
      setNoResult(false)
    }
    prevDeckTrackId.current = currentTrackId
  }, [selectedDeckInfo])

  // Clear recommendation when scan starts (per PRD F8)
  useEffect(() => {
    if (scanning) {
      setRecommendation(null)
      setNoResult(false)
    }
  }, [scanning])

  const handleGetRecommendation = useCallback(async () => {
    const result = await onGetRecommendation()
    if (result) {
      setRecommendation(result)
      setNoResult(false)
    } else {
      setRecommendation(null)
      setNoResult(true)
    }
  }, [onGetRecommendation])

  // Determine if the button should be enabled
  const hasTrack = selectedDeckInfo?.track != null
  const buttonEnabled =
    viewState === 'ready' && hasTrack && trackInLibrary && libraryIndex != null

  const buttonDisabledReason = !hasTrack
    ? 'No deck loaded.'
    : !trackInLibrary
      ? 'Track not in scanned library.'
      : !libraryIndex
        ? 'Library not loaded.'
        : ''

  // Empty library message (E3)
  const isEmptyLibrary =
    viewState === 'ready' && libraryIndex != null && libraryIndex.tracks.length === 0

  const showUpdateBanner =
    updateAvailable != null && !updateDismissed && viewState === 'ready'

  const showFileAccessBanner =
    !hasFileAccess && !fileAccessDismissed && viewState === 'ready'

  return (
    <ScreenWrapper>
      {/* Title bar area with gear icon and optional update banner */}
      <div
        className="titlebar-drag-region"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: `${spacing.sm}px 0`,
          }}
        >
          <GearIcon onClick={onOpenSettings} />
        </div>

        {showUpdateBanner && (
          <UpdateBanner
            version={updateAvailable!.version}
            downloaded={updateDownloaded}
            onRestart={onInstallUpdate}
            onDismiss={onDismissUpdate}
          />
        )}

        {showFileAccessBanner && (
          <FileAccessBanner onDismiss={() => setFileAccessDismissed(true)} />
        )}
      </div>

      {/* Error state */}
      {viewState === 'error' && appError && (
        <ErrorState error={appError} onRetry={onRetry} />
      )}

      {/* Subscription expired overlay */}
      {viewState === 'subscription-expired' && (
        <SubscriptionExpiry
          userEmail={authState?.userEmail ?? null}
          onRenew={onRenewSubscription}
          onCheckAgain={onCheckSubscription}
          onSignOut={onSignOut}
        />
      )}

      {/* Library scanning state */}
      {(viewState === 'scanning' || viewState === 'scan-complete') && (
        <LibraryScanLoader
          tracksIndexed={scanProgress}
          isRescan={isRescan}
          complete={scanComplete}
        />
      )}

      {/* Ready state — the core interaction surface */}
      {viewState === 'ready' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing['2xl'],
            overflow: 'auto',
          }}
        >
          {/* Now Playing section — both decks */}
          <NowPlaying
            deckState={deckState}
            selectedDeck={selectedDeck}
            onSelectDeck={onSelectDeck}
            trackInLibrary={trackInLibrary}
          />

          {/* Empty library message (E3) */}
          {isEmptyLibrary && (
            <p
              style={{
                ...typeScale.bodySmall,
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 320,
              }}
            >
              No tracks with key and BPM data found. Tag your tracks in Serato
              to get recommendations.
            </p>
          )}

          {/* DROP A HEATER button */}
          <HeaterButton
            enabled={buttonEnabled}
            onPress={handleGetRecommendation}
            disabledReason={buttonDisabledReason}
          />

          {/* Recommendation Card */}
          <RecommendationCard
            recommendation={recommendation}
            noResult={noResult}
            showFinder={!hasFileAccess}
          />
        </div>
      )}

      {/* Toast for "You're on the latest version" */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </ScreenWrapper>
  )
}
