// ============================================================
// FileAccessBanner Component
// ============================================================
// Persistent banner nudging the DJ to grant Full Disk Access.
// Dismissible per session but reappears on next launch.
// Shows when drag-to-Serato won't work for all file locations.

import React from 'react'
import { Button } from '../shared/components/Button'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
import { useIpc } from '../shared/hooks/useIpc'

interface FileAccessBannerProps {
  onDismiss: () => void
}

export const FileAccessBanner: React.FC<FileAccessBannerProps> = ({ onDismiss }) => {
  const api = useIpc()

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        background: colors.flameMuted,
        borderRadius: radii.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ ...typeScale.bodySmall, color: colors.text, marginBottom: spacing.xs }}>
            Enable <strong>Full Disk Access</strong> to drag tracks directly into Serato from any folder.
          </p>
          <p style={{ ...typeScale.bodyXs, color: colors.textSecondary }}>
            Drop A Heater never writes or uploads your data — everything stays on your device.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss file access prompt"
          style={{
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: spacing.xs,
            flexShrink: 0,
          }}
        >
          &times;
        </button>
      </div>
      <div style={{ display: 'flex', gap: spacing.sm }} className="titlebar-no-drag">
        <Button
          variant="primary"
          size="small"
          onClick={() => api.openFileAccessSettings()}
        >
          Open Settings
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={onDismiss}
        >
          Not now
        </Button>
      </div>
    </div>
  )
}
