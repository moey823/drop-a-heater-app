// ============================================================
// App — Root Component
// ============================================================
// Manages the top-level navigation state.
// Two full-window states (Auth and Main) and one overlay panel (Settings).
// No router needed — state transitions driven by IPC events.
//
// Navigation model (per PRD IA):
//   - Auth Screen: shown when no valid DJ ID token exists
//   - Main View: home screen after auth + subscription + library scan
//   - Settings Panel: slide-over overlay on Main View

import React, { useState } from 'react'
import { AuthScreen } from './screens/AuthScreen'
import { MainView } from './screens/MainView'
import { SettingsPanel } from './screens/SettingsPanel'

/** The two full-window states */
type AppView = 'auth' | 'main'

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('auth')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // These state setters will be wired to IPC events by the builder.
  // For now, they serve as the navigation skeleton.
  // The builder will add:
  //   - useEffect to check auth state on mount
  //   - IPC event listeners for auth changes
  //   - Subscription validation flow
  //   - Library scan flow

  return (
    <>
      {currentView === 'auth' && <AuthScreen />}
      {currentView === 'main' && <MainView />}
      {currentView === 'main' && (
        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
