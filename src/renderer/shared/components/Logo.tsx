// ============================================================
// Logo Component
// ============================================================
// SVG logo mark from Brand Kit Section 03 (dark mode variant).
// Renders at a configurable size. Used on Auth Screen, loading states,
// Settings panel, and subscription expiry overlay.
//
// Usage:
//   <Logo size={64} />
//   <Logo size={120} />

import React from 'react'

export interface LogoProps {
  /** Rendered size in pixels (width and height) */
  size?: number
  /** Additional inline styles */
  style?: React.CSSProperties
}

export const Logo: React.FC<LogoProps> = ({ size = 64, style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      {/* Circle — button shape */}
      <circle cx="256" cy="256" r="240" fill="#FF5A14" />
      {/* Outer flame — negative space */}
      <path
        d="M256 112 C256 112 200 200 200 272 C200 320 224 368 256 392 C288 368 312 320 312 272 C312 200 256 112 256 112Z"
        fill="#121218"
      />
      {/* Inner flame — positive space */}
      <path
        d="M256 192 C256 192 228 240 228 280 C228 308 240 336 256 352 C272 336 284 308 284 280 C284 240 256 192 256 192Z"
        fill="#FF5A14"
      />
    </svg>
  )
}
