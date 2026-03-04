// ============================================================
// Settings Panel — Full Implementation
// ============================================================
// Slide-over panel from right edge (360px wide).
// PRD ref: F9 (Settings Panel), F8 (Re-scan), F10 (Updates)
//
// Sections:
//   - ACCOUNT: display name, email, subscription badge
//   - LIBRARY: tracks indexed, excluded count, last scan, re-scan button
//   - ABOUT: version, check for updates link
//   - Sign Out ghost button at bottom
//
// The panel overlays the Main View with a semi-transparent scrim.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
import { SectionLabel } from '../shared/components/SectionLabel'
import { Button } from '../shared/components/Button'
import { SETTINGS_PANEL_WIDTH } from '../../shared/constants'
import type { AuthState, SubscriptionStatus, LibraryIndex } from '../../shared/types'

export interface SettingsPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean
  /** Callback to close the panel */
  onClose: () => void
  /** Current auth state */
  authState: AuthState | null
  /** Current subscription status */
  subscriptionStatus: SubscriptionStatus | null
  /** Current library index */
  libraryIndex: LibraryIndex | null
  /** Trigger library re-scan */
  onRescan: () => void
  /** Sign out */
  onSignOut: () => void
  /** Check for updates — returns true if update available */
  onCheckForUpdates: () => Promise<boolean>
  /** App version string */
  appVersion: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  authState,
  subscriptionStatus,
  libraryIndex,
  onRescan,
  onSignOut,
  onCheckForUpdates,
  appVersion,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updateCheckResult, setUpdateCheckResult] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Focus the close button when panel opens
  useEffect(() => {
    if (isOpen && closeRef.current) {
      closeRef.current.focus()
    }
  }, [isOpen])

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSignOutConfirm) {
          setShowSignOutConfirm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, showSignOutConfirm])

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setShowSignOutConfirm(false)
      setUpdateCheckResult(null)
    }
  }, [isOpen])

  const handleRescan = useCallback(() => {
    onRescan()
    onClose()
  }, [onRescan, onClose])

  const handleSignOutConfirm = useCallback(() => {
    setShowSignOutConfirm(false)
    onSignOut()
  }, [onSignOut])

  const handleCheckUpdates = useCallback(async () => {
    setCheckingUpdates(true)
    setUpdateCheckResult(null)
    const available = await onCheckForUpdates()
    setCheckingUpdates(false)
    if (!available) {
      setUpdateCheckResult("You're on the latest version.")
    }
  }, [onCheckForUpdates])

  // Format the last scanned timestamp
  const formatLastScanned = (timestamp: number | undefined): string => {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `Today at ${displayHours}:${minutes} ${ampm}`
  }

  // Subscription badge
  const isSubscriptionActive = subscriptionStatus?.status === 'active'
  const subscriptionBadgeColor = isSubscriptionActive ? colors.success : colors.error
  const subscriptionBadgeText = isSubscriptionActive ? 'Active' : 'Expired'
  const subscriptionExpiryText = subscriptionStatus?.expiresAt
    ? new Date(subscriptionStatus.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  if (!isOpen) return null

  return (
    <>
      {/* Scrim overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: SETTINGS_PANEL_WIDTH,
          background: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
          borderTopLeftRadius: radii.xl,
          borderBottomLeftRadius: radii.xl,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          padding: spacing['2xl'],
          paddingTop: spacing['5xl'],
          overflow: 'auto',
          transform: 'translateX(0)',
          transition: prefersReducedMotion ? 'none' : 'transform 0.25s ease',
        }}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close settings"
          style={{
            position: 'absolute',
            top: spacing.lg,
            right: spacing.lg,
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: spacing.sm,
            outline: 'none',
          }}
        >
          &times;
        </button>

        {/* ACCOUNT section */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>Account</SectionLabel>

        <p
          style={{
            ...typeScale.settingsName,
            color: colors.text,
            marginBottom: spacing.xs,
          }}
        >
          {authState?.userDisplayName || 'DJ'}
        </p>

        <p
          style={{
            ...typeScale.bodyXs,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}
        >
          {authState?.userEmail || ''}
        </p>

        {/* Subscription badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing['3xl'],
          }}
        >
          <span
            style={{
              ...typeScale.mono,
              color: colors.bg,
              background: subscriptionBadgeColor,
              padding: `2px ${spacing.sm}px`,
              borderRadius: radii.sm,
              fontWeight: 600,
            }}
          >
            {subscriptionBadgeText}
          </span>
          {subscriptionExpiryText && (
            <span style={{ ...typeScale.mono, color: colors.textSecondary }}>
              {isSubscriptionActive ? 'Expires' : 'Expired'}{' '}
              {subscriptionExpiryText}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: colors.border,
            marginBottom: spacing['2xl'],
          }}
        />

        {/* LIBRARY section */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>Library</SectionLabel>

        <p
          style={{
            ...typeScale.bodySmall,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          Tracks indexed: {libraryIndex?.tracks.length.toLocaleString() ?? '—'}
        </p>

        {libraryIndex && libraryIndex.excludedCount > 0 && (
          <p
            style={{
              ...typeScale.bodyXs,
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Tracks excluded: {libraryIndex.excludedCount.toLocaleString()}{' '}
            (missing key or BPM)
          </p>
        )}

        <p
          style={{
            ...typeScale.bodyXs,
            color: colors.textSecondary,
            marginBottom: spacing.xl,
          }}
        >
          Last scanned: {formatLastScanned(libraryIndex?.scannedAt)}
        </p>

        <Button
          variant="accent"
          onClick={handleRescan}
          aria-label="Re-scan library"
          style={{ alignSelf: 'flex-start', marginBottom: spacing['3xl'] }}
        >
          Re-scan Library
        </Button>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: colors.border,
            marginBottom: spacing['2xl'],
          }}
        />

        {/* ABOUT section */}
        <SectionLabel style={{ marginBottom: spacing.lg }}>About</SectionLabel>

        <p
          style={{
            ...typeScale.bodyXs,
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          Drop A Heater v{appVersion}
        </p>

        <button
          onClick={handleCheckUpdates}
          disabled={checkingUpdates}
          aria-label="Check for updates"
          style={{
            background: 'none',
            border: 'none',
            color: colors.flame,
            ...typeScale.bodyXs,
            cursor: checkingUpdates ? 'wait' : 'pointer',
            padding: 0,
            textAlign: 'left',
            marginBottom: spacing.sm,
            opacity: checkingUpdates ? 0.6 : 1,
            outline: 'none',
          }}
        >
          {checkingUpdates ? 'Checking...' : 'Check for Updates'}
        </button>

        {updateCheckResult && (
          <p
            style={{
              ...typeScale.bodyXs,
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
            role="status"
            aria-live="polite"
          >
            {updateCheckResult}
          </p>
        )}

        {/* Spacer to push Sign Out to bottom */}
        <div style={{ flex: 1, minHeight: spacing['3xl'] }} />

        {/* Sign Out */}
        {!showSignOutConfirm ? (
          <Button
            variant="ghost"
            onClick={() => setShowSignOutConfirm(true)}
            aria-label="Sign out"
            fullWidth
          >
            Sign Out
          </Button>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                ...typeScale.bodySmall,
                color: colors.text,
                marginBottom: spacing.sm,
              }}
            >
              Sign out of DJ ID?
            </p>
            <div
              style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}
            >
              <Button
                variant="primary"
                onClick={handleSignOutConfirm}
                style={{ background: colors.error }}
              >
                Sign Out
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
