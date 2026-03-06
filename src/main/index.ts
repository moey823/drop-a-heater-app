// ============================================================
// Drop A Heater — Electron Main Process
// ============================================================
// Entry point for the Electron main process. Handles:
//   - Window creation and management
//   - macOS menu bar
//   - Custom URL scheme registration (dropaheater://)
//   - IPC handler registration
//   - App lifecycle events

import { app, BrowserWindow, Menu, shell } from 'electron'
import * as path from 'path'
import { WINDOW, URL_SCHEME } from '@shared/constants'
import { registerIpcHandlers, handleAuthCallback, cleanup } from './ipc-handlers'
import { isTestMode, registerTestModeHandlers, cleanupTestMode } from './test-mode'

// Register as the handler for the dropaheater:// URL scheme
if (process.defaultApp) {
  // Dev mode: register with the path to Electron
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(URL_SCHEME, process.execPath, [
      path.resolve(process.argv[1]),
    ])
  }
} else {
  // Production: standard registration
  app.setAsDefaultProtocolClient(URL_SCHEME)
}

let mainWindow: BrowserWindow | null = null

/**
 * Create the main application window.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: WINDOW.defaultWidth,
    height: WINDOW.defaultHeight,
    minWidth: WINDOW.minWidth,
    minHeight: WINDOW.minHeight,
    backgroundColor: '#121218', // Dark mode background
    titleBarStyle: 'hiddenInset', // macOS native title bar with inset traffic lights
    show: false, // Don't show until ready
    fullscreenable: false, // Per PRD F11: no full screen mode
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Show window when ready to prevent visual flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    // Development: load from Vite dev server
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    // Production: load the built HTML file
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Build the macOS menu bar per PRD F11.
 */
function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Drop A Heater',
      submenu: [
        { role: 'about', label: 'About Drop A Heater' },
        { type: 'separator' },
        {
          label: 'Re-scan Library',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.send('menu:rescan')
          },
        },
        {
          label: 'Check for Updates',
          click: () => {
            mainWindow?.webContents.send('menu:check-updates')
          },
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Drop A Heater' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Drop A Heater Help',
          click: async () => {
            await shell.openExternal('https://dropaheater.com')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ---- App Lifecycle ----

// macOS: Prevent multiple instances. The second instance sends its argv
// to the first instance, which handles the URL scheme callback.
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // macOS: handle URL scheme from second instance
    if (!isTestMode) {
      const url = commandLine.find(arg => arg.startsWith(`${URL_SCHEME}://`))
      if (url) {
        handleAuthCallback(url)
      }
    }

    // Focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Register IPC handlers before creating the window
    if (isTestMode) {
      registerTestModeHandlers()
    } else {
      registerIpcHandlers()
    }

    // Build the menu bar
    buildMenu()

    // Create the main window
    createWindow()
  })

  // macOS: Handle URL scheme (when app is already running)
  app.on('open-url', (event, url) => {
    event.preventDefault()
    if (!isTestMode && url.startsWith(`${URL_SCHEME}://`)) {
      handleAuthCallback(url)
    }
  })

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // macOS: Close window hides the app but doesn't quit
  // (standard macOS behavior — Cmd+Q to quit)
  app.on('window-all-closed', () => {
    // On macOS, keep the app running in the background (standard behavior)
    // The user quits via Cmd+Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    if (isTestMode) {
      cleanupTestMode()
    } else {
      cleanup()
    }
  })
}
