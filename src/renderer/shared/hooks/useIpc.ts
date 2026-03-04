// ============================================================
// useIpc Hook
// ============================================================
// Provides typed access to the IPC API exposed by the preload script.
// All renderer-to-main communication should go through this hook.
//
// Usage:
//   const api = useIpc()
//   const authState = await api.getAuthState()
//   api.signIn()
//
// For event subscriptions (push from main):
//   useEffect(() => {
//     const unsub = api.onDeckStateChanged((data) => {
//       setDeckState(data as DeckState)
//     })
//     return unsub
//   }, [api])

import type { ElectronAPI } from '../../../preload/index'

/**
 * Access the IPC API exposed by the Electron preload script.
 * This is available as window.api after the preload runs.
 */
export function useIpc(): ElectronAPI {
  return (window as unknown as { api: ElectronAPI }).api
}
