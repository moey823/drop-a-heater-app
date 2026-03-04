// ============================================================
// Design Tokens — Border Radii
// ============================================================
// From Brand Kit Section 09 (Shape Language).
// Rounded but not bubbly — confident geometry that respects the content.

export const radii = {
  /** 6px — inputs, icon containers */
  sm: 6,
  /** 10px — cards, transparency display */
  md: 10,
  /** 16px — modals */
  lg: 16,
  /** 24px — panels */
  xl: 24,
  /** 9999px — buttons (pill shape) */
  full: 9999,
} as const

export type RadiusToken = keyof typeof radii
