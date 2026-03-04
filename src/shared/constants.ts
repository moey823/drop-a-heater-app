// ============================================================
// Drop A Heater — App-wide Constants
// ============================================================

/** Serato library location (standard macOS path) */
export const SERATO_LIBRARY_PATH = '~/Music/_Serato_/'

/** OAuth2 configuration for DJ ID */
export const DJID_OAUTH = {
  authorizeUrl: 'https://djid.me/oauth/authorize',
  tokenUrl: 'https://djid.me/oauth/token',
  redirectUri: 'dropaheater://auth/callback',
  clientId: 'drop-a-heater', // TODO: Replace with actual client_id from DJ ID
  scopes: ['openid', 'profile', 'email'],
} as const

/** Custom URL scheme for OAuth2 callback */
export const URL_SCHEME = 'dropaheater'

/** Subscription validation API */
export const SUBSCRIPTION_API = {
  /** Base URL of the marketing site (Replit-hosted) */
  baseUrl: 'https://dropaheater.replit.app', // TODO: Replace with actual marketing site URL
  /** Validation endpoint path */
  validatePath: '/api/subscription/validate',
} as const

/** Window dimensions (per PRD F11) */
export const WINDOW = {
  defaultWidth: 480,
  defaultHeight: 720,
  minWidth: 400,
  minHeight: 600,
} as const

/** Settings panel width (per PRD F9) */
export const SETTINGS_PANEL_WIDTH = 360

/** Deck state polling interval in milliseconds */
export const DECK_WATCH_INTERVAL_MS = 1000

/** Library scan completion message hold duration */
export const SCAN_COMPLETE_HOLD_MS = 2000

/** Matching algorithm parameters (per PRD F6) */
export const ALGORITHM = {
  /** BPM proximity weight */
  bpmWeight: 0.7,
  /** Genre match weight */
  genreWeight: 0.3,
  /** Maximum BPM deviation (as a fraction, i.e. 0.05 = ±5%) */
  bpmMaxDeviation: 0.05,
} as const

/** BPM delta threshold for warning vs success color (per PRD F7) */
export const BPM_WARNING_THRESHOLD_PERCENT = 3.0

/** Keychain service name for storing DJ ID tokens */
export const KEYCHAIN_SERVICE = 'com.dropaheater.auth'
