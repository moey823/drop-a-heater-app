// ============================================================
// Design Tokens — Typography
// ============================================================
// Extracted from Brand Kit Section 06 and PRD Brand Implementation Notes.
// Fonts are bundled with the app (not loaded from CDN) for offline use.
//
// Font families:
//   - Inter: display, headings, body text, buttons
//   - IBM Plex Mono: data readouts, section labels, transparency display
//
// Weights used:
//   Inter: 400, 500, 600, 700, 800, 900
//   IBM Plex Mono: 400, 500, 600

import type { CSSProperties } from 'react'

/** Font family constants */
export const fontFamily = {
  display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'IBM Plex Mono', 'SF Mono', 'Menlo', monospace",
} as const

/** Complete type scale. Each entry is a ready-to-spread style object. */
export const typeScale = {
  /** H1 — Hero / Page Title: Inter 900, 48px, line-height 1.1, letter-spacing -1px */
  h1: {
    fontFamily: fontFamily.display,
    fontWeight: 900,
    fontSize: 48,
    lineHeight: 1.1,
    letterSpacing: -1,
  } satisfies CSSProperties,

  /** H2 — Section Title: Inter 800, 36px, line-height 1.15 */
  h2: {
    fontFamily: fontFamily.display,
    fontWeight: 800,
    fontSize: 36,
    lineHeight: 1.15,
  } satisfies CSSProperties,

  /** H3 — Subsection / Track name in recommendation: Inter 700, 22px, line-height 1.3 */
  h3: {
    fontFamily: fontFamily.display,
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 1.3,
  } satisfies CSSProperties,

  /** Now Playing track name: Inter 600, 16px, line-height 1.4 */
  subtitle: {
    fontFamily: fontFamily.display,
    fontWeight: 600,
    fontSize: 16,
    lineHeight: 1.4,
  } satisfies CSSProperties,

  /** Body text: Inter 400, 16px, line-height 1.6 */
  body: {
    fontFamily: fontFamily.display,
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  /** Body medium: Inter 500, 16px, line-height 1.6 */
  bodyMedium: {
    fontFamily: fontFamily.display,
    fontWeight: 500,
    fontSize: 16,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  /** Artist name / secondary body: Inter 400, 15px, line-height 1.6 */
  bodySmall: {
    fontFamily: fontFamily.display,
    fontWeight: 400,
    fontSize: 15,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  /** Settings item text: Inter 400, 14px, line-height 1.5 */
  bodyXs: {
    fontFamily: fontFamily.display,
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.5,
  } satisfies CSSProperties,

  /** Settings display name: Inter 600, 18px, line-height 1.4 */
  settingsName: {
    fontFamily: fontFamily.display,
    fontWeight: 600,
    fontSize: 18,
    lineHeight: 1.4,
  } satisfies CSSProperties,

  /** Button label: Inter 600, 15px, line-height 1.0 */
  button: {
    fontFamily: fontFamily.display,
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.0,
  } satisfies CSSProperties,

  /** Main recommendation button label: Inter 700, 16px, all caps */
  buttonLarge: {
    fontFamily: fontFamily.display,
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.0,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  /** Caption: Inter 400, 13px, line-height 1.5 */
  caption: {
    fontFamily: fontFamily.display,
    fontWeight: 400,
    fontSize: 13,
    lineHeight: 1.5,
  } satisfies CSSProperties,

  /** Section label / Overline: IBM Plex Mono 600, 11px, uppercase, letter-spacing 2px */
  label: {
    fontFamily: fontFamily.mono,
    fontWeight: 600,
    fontSize: 11,
    lineHeight: 1.4,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  /** Data readout (transparency display): IBM Plex Mono 400, 13px, line-height 1.8 */
  dataReadout: {
    fontFamily: fontFamily.mono,
    fontWeight: 400,
    fontSize: 13,
    lineHeight: 1.8,
  } satisfies CSSProperties,

  /** Subscription badge / small mono: IBM Plex Mono 400, 12px */
  mono: {
    fontFamily: fontFamily.mono,
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1.4,
  } satisfies CSSProperties,

  /** Data readout medium: IBM Plex Mono 400, 14px, line-height 1.6 */
  dataReadoutMd: {
    fontFamily: fontFamily.mono,
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  /** Scan counter: IBM Plex Mono 400, 14px */
  counter: {
    fontFamily: fontFamily.mono,
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.4,
  } satisfies CSSProperties,
} as const

export type TypeScaleToken = keyof typeof typeScale
