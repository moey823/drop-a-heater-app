// ============================================================
// UpdateBanner Component
// ============================================================
// Non-intrusive banner at the top of the Main View when an
// app update is available.
// PRD ref: F10 (App Updates)

import React from 'react'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'

interface UpdateBannerProps {
  /** Version string of the available update */
  version: string
  /** Whether the update binary has finished downloading */
  downloaded: boolean
  /** Called when the DJ clicks "Restart" */
  onRestart: () => void
  /** Called when the DJ dismisses the banner */
  onDismiss: () => void
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  version,
  downloaded,
  onRestart,
  onDismiss,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        background: colors.infoMuted,
        borderRadius: radii.md,
        padding: `${spacing.sm}px ${spacing.lg}px`,
        width: '100%',
      }}
    >
      <p style={{ ...typeScale.bodyXs, color: colors.text, flex: 1 }}>
        Update available (v{version}). Restart to update.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          flexShrink: 0,
        }}
        className="titlebar-no-drag"
      >
        {downloaded ? (
          <Button
            variant="secondary"
            size="small"
            onClick={onRestart}
            aria-label="Restart to install update"
          >
            Restart
          </Button>
        ) : (
          <span
            style={{
              ...typeScale.bodyXs,
              color: colors.textSecondary,
              fontStyle: 'italic',
            }}
          >
            Downloading...
          </span>
        )}

        <button
          onClick={onDismiss}
          aria-label="Dismiss update notification"
          style={{
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: spacing.xs,
          }}
        >
          &times;
        </button>
      </div>
    </div>
  )
}
