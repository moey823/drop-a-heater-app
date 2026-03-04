// ============================================================
// Design Tokens — Colors (Dark Mode Only, V1)
// ============================================================
// Extracted from Brand Kit Section 05 (Light-to-Dark Mapping).
// The app ships in dark mode only for V1.
// DO NOT hardcode color values anywhere — always import from this file.

export const colors = {
  /** Primary action color — recommendation button, active states, section labels */
  flame: '#FF5A14',
  /** Primary hover state */
  flameHover: '#FF6D33',
  /** Flame at low opacity — ghost button hover fill, focus ring glow */
  flameMuted: 'rgba(255, 90, 20, 0.125)',

  /** App background */
  bg: '#121218',
  /** Card backgrounds, transparency display background, settings panel */
  surface: '#1E1E2A',
  /** Deep secondary background */
  secondaryBg: '#0F0F1A',
  /** Border color for cards and dividers */
  border: '#2A2A3A',

  /** Primary text color */
  text: '#EDEDF0',
  /** Secondary text — labels, captions, artist names */
  textSecondary: '#9999AA',

  /** Accent color — re-scan button */
  gold: '#FFC633',
  /** Accent hover state */
  goldHover: '#FFD24D',
  /** Gold at low opacity */
  goldMuted: 'rgba(255, 198, 51, 0.125)',

  /** Positive match indicators in transparency display */
  success: '#34D399',
  /** Near-boundary match indicators (BPM delta >3%) */
  warning: '#FBBF24',
  /** Error messages, destructive actions (sign out confirmation) */
  error: '#F87171',
  /** Update banner, informational highlights */
  info: '#60A5FA',
  /** Info at low opacity — update banner background */
  infoMuted: 'rgba(96, 165, 250, 0.15)',

  /** White — button text on flame background */
  white: '#FFFFFF',
  /** Transparent */
  transparent: 'transparent',
} as const

export type ColorToken = keyof typeof colors
