// ============================================================
// Preload Script
// ============================================================
// Exposes a typed API from the main process to the renderer
// via Electron's contextBridge. The renderer accesses this
// through window.api.
//
// All IPC communication goes through this bridge — the renderer
// never imports Electron directly.

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_INVOKE, IPC_EVENT } from '@shared/ipc-channels'

/** The API exposed to the renderer via window.api */
const api = {
  // ---- Auth ----
  signIn: () => ipcRenderer.invoke(IPC_INVOKE.AUTH_SIGN_IN),
  cancelSignIn: () => ipcRenderer.invoke(IPC_INVOKE.AUTH_CANCEL),
  signOut: () => ipcRenderer.invoke(IPC_INVOKE.AUTH_SIGN_OUT),
  getAuthState: () => ipcRenderer.invoke(IPC_INVOKE.AUTH_GET_STATE),

  // ---- Subscription ----
  validateSubscription: () => ipcRenderer.invoke(IPC_INVOKE.SUBSCRIPTION_VALIDATE),

  // ---- Library ----
  scanLibrary: () => ipcRenderer.invoke(IPC_INVOKE.LIBRARY_SCAN),
  getLibraryIndex: () => ipcRenderer.invoke(IPC_INVOKE.LIBRARY_GET_INDEX),

  // ---- Recommendation ----
  getRecommendation: (deckNumber: number) => ipcRenderer.invoke(IPC_INVOKE.RECOMMENDATION_GET, deckNumber),

  // ---- Deck State ----
  getDeckState: () => ipcRenderer.invoke(IPC_INVOKE.DECK_GET_STATE),

  // ---- Updates ----
  checkForUpdates: () => ipcRenderer.invoke(IPC_INVOKE.UPDATE_CHECK),
  installUpdate: () => ipcRenderer.invoke(IPC_INVOKE.UPDATE_INSTALL),

  // ---- Shell ----
  openExternal: (url: string) => ipcRenderer.invoke(IPC_INVOKE.SHELL_OPEN_EXTERNAL, url),

  // ---- Finder ----
  showInFolder: (filePath: string) => ipcRenderer.invoke(IPC_INVOKE.SHELL_SHOW_IN_FOLDER, filePath),

  // ---- Event Listeners ----
  // Subscribe to push events from the main process.
  // Returns an unsubscribe function.

  onLibraryScanProgress: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_EVENT.LIBRARY_SCAN_PROGRESS, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.LIBRARY_SCAN_PROGRESS, handler)
  },

  onDeckStateChanged: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_EVENT.DECK_STATE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.DECK_STATE_CHANGED, handler)
  },

  onAuthStateChanged: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_EVENT.AUTH_STATE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.AUTH_STATE_CHANGED, handler)
  },

  onUpdateAvailable: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_EVENT.UPDATE_AVAILABLE, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.UPDATE_AVAILABLE, handler)
  },

  onUpdateDownloaded: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_EVENT.UPDATE_DOWNLOADED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.UPDATE_DOWNLOADED, handler)
  },

  onLibraryChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC_EVENT.LIBRARY_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENT.LIBRARY_CHANGED, handler)
  },

  // ---- Menu Events ----
  onMenuRescan: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu:rescan', handler)
    return () => ipcRenderer.removeListener('menu:rescan', handler)
  },

  onMenuCheckUpdates: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu:check-updates', handler)
    return () => ipcRenderer.removeListener('menu:check-updates', handler)
  },
}

// Expose the API to the renderer
contextBridge.exposeInMainWorld('api', api)

// Type declaration for the renderer to use
export type ElectronAPI = typeof api
