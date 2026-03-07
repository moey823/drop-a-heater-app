// ============================================================
// Drop A Heater — IPC Channel Constants
// ============================================================
// All IPC communication between main and renderer uses these channel names.
// Invoke channels use the request/response pattern (ipcRenderer.invoke).
// Event channels use the push pattern (mainWindow.webContents.send).

/** Invoke channels: renderer calls main, main responds */
export const IPC_INVOKE = {
  /** Start the OAuth2 sign-in flow. Returns void (browser opens). */
  AUTH_SIGN_IN: 'auth:sign-in',
  /** Cancel the in-progress sign-in flow. */
  AUTH_CANCEL: 'auth:cancel',
  /** Sign out — clear tokens from Keychain. Returns void. */
  AUTH_SIGN_OUT: 'auth:sign-out',
  /** Get current auth state. Returns AuthState. */
  AUTH_GET_STATE: 'auth:get-state',

  /** Validate subscription. Returns SubscriptionStatus. */
  SUBSCRIPTION_VALIDATE: 'subscription:validate',

  /** Start a library scan (initial or re-scan). Returns void (progress comes via events). */
  LIBRARY_SCAN: 'library:scan',
  /** Get the current library index (if available). Returns LibraryIndex | null. */
  LIBRARY_GET_INDEX: 'library:get-index',

  /** Request a recommendation based on current deck state. Returns Recommendation | null. */
  RECOMMENDATION_GET: 'recommendation:get',

  /** Get current deck state. Returns DeckState. */
  DECK_GET_STATE: 'deck:get-state',

  /** Check for app updates. Returns { available: boolean, version?: string }. */
  UPDATE_CHECK: 'update:check',
  /** Download and install the pending update. Returns void (app will restart). */
  UPDATE_INSTALL: 'update:install',

  /** Open a URL in the system default browser. */
  SHELL_OPEN_EXTERNAL: 'shell:open-external',

  /** Reveal a file in Finder. Arg: filePath. */
  SHELL_SHOW_IN_FOLDER: 'shell:show-in-folder',

  /** Check if the app has full file access (can read ~/Downloads/). Returns boolean. */
  CHECK_FILE_ACCESS: 'system:check-file-access',

  /** Open System Settings to Privacy & Security > Full Disk Access. */
  OPEN_FILE_ACCESS_SETTINGS: 'system:open-file-access-settings',
} as const

/** Send channels: renderer fires to main, no response (fire-and-forget) */
export const IPC_SEND = {
  /** Start a native file drag for a track. Arg: filePath. */
  NATIVE_DRAG: 'native:drag',
} as const

/** Event channels: main pushes to renderer */
export const IPC_EVENT = {
  /** Library scan progress update. Payload: LibraryScanProgress. */
  LIBRARY_SCAN_PROGRESS: 'library:scan-progress',

  /** Deck state changed. Payload: DeckState. */
  DECK_STATE_CHANGED: 'deck:state-changed',

  /** Auth state changed (e.g. OAuth callback received). Payload: AuthState. */
  AUTH_STATE_CHANGED: 'auth:state-changed',

  /** App update available. Payload: { version: string, downloading: boolean }. */
  UPDATE_AVAILABLE: 'update:available',
  /** App update downloaded and ready to install. Payload: { version: string }. */
  UPDATE_DOWNLOADED: 'update:downloaded',

  /** Serato library files changed on disk — renderer should re-scan. */
  LIBRARY_CHANGED: 'library:changed',
} as const
