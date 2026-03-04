# Drop A Heater — Builder Conventions

This document defines the patterns, rules, and conventions for building features in the Drop A Heater codebase. Read this fully before writing any code.

---

## 1. Architecture Overview

Drop A Heater is an Electron desktop app (Mac only) with three process layers:

| Process | Location | Responsibility |
|---|---|---|
| **Main** | `src/main/` | Filesystem access, Serato parsing, deck state watching, OAuth2 flow, subscription validation, IPC handlers, menu bar, window management |
| **Preload** | `src/preload/` | Context bridge — exposes typed IPC API to the renderer via `window.api` |
| **Renderer** | `src/renderer/` | React UI — screens, components, design tokens, user interaction |

**Shared types and constants** live in `src/shared/` and are imported by all three processes.

### Communication Pattern

The renderer never imports Electron directly. All communication with the main process goes through the preload bridge:

```typescript
// In the renderer:
import { useIpc } from '../shared/hooks/useIpc'

const api = useIpc()

// Invoke (request/response):
const authState = await api.getAuthState()
const recommendation = await api.getRecommendation()

// Event subscription (push from main):
useEffect(() => {
  const unsub = api.onDeckStateChanged((data) => {
    setDeckState(data as DeckState)
  })
  return unsub
}, [])
```

---

## 2. File Ownership

### Architect-Owned (do not modify)

| Directory / File | Contents |
|---|---|
| `src/main/` | Electron main process — all files |
| `src/shared/` | Types, IPC channels, constants |
| `src/preload/` | Context bridge |
| `src/renderer/shared/` | Design tokens, shared components, hooks, global styles |
| `CONVENTIONS.md` | This file |
| `package.json` | Dependencies and scripts (add deps, don't restructure) |
| `electron.vite.config.ts` | Build configuration |
| `tsconfig.json` / `tsconfig.node.json` | TypeScript configuration |

### Builder-Owned

| Directory | Contents |
|---|---|
| `src/renderer/screens/` | All screen implementations (AuthScreen, MainView, SettingsPanel) |
| `src/renderer/components/` | Feature-specific components (recommendation card, transparency display, deck state indicator, etc.) |
| `src/renderer/App.tsx` | Root component — wire up IPC events, manage navigation state |

The builder can add new files to `src/renderer/screens/` and `src/renderer/components/`. The builder should NOT create new files in `src/main/`, `src/shared/`, `src/preload/`, or `src/renderer/shared/`. If a shared component or type is needed, request it from the architect.

---

## 3. File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `RecommendationCard.tsx` |
| Hooks | camelCase, prefixed with `use` | `useDeckState.ts` |
| Utilities | camelCase `.ts` | `formatBpmDelta.ts` |
| Type files | camelCase `.ts` | `types.ts` |
| Style files | camelCase `.css` | `global.css` |
| Test files | Same name + `.test.ts(x)` | `algorithm.test.ts` |
| Directories | kebab-case | `design-tokens/` |

---

## 4. Component Patterns

### Creating a New Screen

Screens live in `src/renderer/screens/`. Each screen:
1. Uses `ScreenWrapper` from shared components for consistent layout.
2. Imports design tokens — never hardcodes colors, fonts, or spacing.
3. Has a single default export (named export is fine, but include default for consistency).

```tsx
import React from 'react'
import { ScreenWrapper } from '../shared/components/ScreenWrapper'
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'

export const MyScreen: React.FC = () => {
  return (
    <ScreenWrapper>
      <h1 style={{ ...typeScale.h3, color: colors.text }}>
        Screen Title
      </h1>
    </ScreenWrapper>
  )
}
```

### Creating a Feature Component

Feature components live in `src/renderer/components/`. Each component:
1. Has a clear props interface defined above the component.
2. Uses shared components (Button, Card, SectionLabel) for UI elements.
3. Uses design tokens for all visual values.
4. Includes `aria-label` on interactive elements (per PRD F12).

```tsx
import React from 'react'
import { Card } from '../shared/components/Card'
import { SectionLabel } from '../shared/components/SectionLabel'
import { colors } from '../shared/design-tokens/colors'

interface RecommendationCardProps {
  trackName: string
  artist: string
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  trackName,
  artist,
}) => {
  return (
    <Card>
      <SectionLabel>RECOMMENDED TRACK</SectionLabel>
      <h3 style={{ ...typeScale.h3, color: colors.text }}>{trackName}</h3>
      <p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>{artist}</p>
    </Card>
  )
}
```

### Using Shared Components

| Component | Import | Purpose |
|---|---|---|
| `Button` | `from '../shared/components/Button'` | All buttons. Variants: `primary`, `secondary`, `accent`, `ghost` |
| `Card` | `from '../shared/components/Card'` | Content cards (recommendation card, etc.) |
| `SectionLabel` | `from '../shared/components/SectionLabel'` | Section labels ("RECOMMENDED TRACK", "NOW PLAYING", etc.) |
| `ScreenWrapper` | `from '../shared/components/ScreenWrapper'` | Full-window layout with dark bg, title bar padding |
| `Logo` | `from '../shared/components/Logo'` | SVG logo mark at any size |
| `Toast` | `from '../shared/components/Toast'` | Auto-dismissing notification |

---

## 5. Styling Approach

### Rules

1. **Always use design tokens.** Never write a raw color hex, font family string, or pixel value. Import from `design-tokens/`.
2. **Inline styles with token objects.** The codebase uses React inline styles (not CSS modules or styled-components). This keeps styling co-located with components and makes token usage explicit.
3. **Spread type scale tokens.** Typography tokens are pre-built style objects — spread them:

```tsx
// CORRECT:
<p style={{ ...typeScale.bodySmall, color: colors.textSecondary }}>
  Artist Name
</p>

// WRONG:
<p style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 400, color: '#9999AA' }}>
  Artist Name
</p>
```

4. **Dark mode only.** V1 ships in dark mode only. There is no theme toggle or light mode variant. All color tokens in `colors.ts` are the dark mode values.

### Design Token Imports

```tsx
import { colors } from '../shared/design-tokens/colors'
import { typeScale } from '../shared/design-tokens/typography'
import { spacing } from '../shared/design-tokens/spacing'
import { radii } from '../shared/design-tokens/radii'
```

---

## 6. Data Access (IPC)

### Invoking Main Process Functions

Use the `useIpc()` hook to get the API object. All methods return Promises (except event subscriptions).

```tsx
import { useIpc } from '../shared/hooks/useIpc'

const MyComponent: React.FC = () => {
  const api = useIpc()

  const handleSignIn = async () => {
    await api.signIn() // Opens system browser to djid.me
  }

  const handleGetRecommendation = async () => {
    const result = await api.getRecommendation()
    // result is Recommendation | null
  }
}
```

### Available IPC Methods

| Method | Returns | Purpose |
|---|---|---|
| `api.signIn()` | `void` | Opens browser to DJ ID OAuth2 |
| `api.cancelSignIn()` | `void` | Cancel in-progress sign-in |
| `api.signOut()` | `void` | Clear tokens, return to auth |
| `api.getAuthState()` | `AuthState` | Current auth state |
| `api.validateSubscription()` | `SubscriptionStatus` | Check subscription |
| `api.scanLibrary()` | `void` | Start library scan (progress via events) |
| `api.getLibraryIndex()` | `LibraryIndex \| null` | Get current library index |
| `api.getRecommendation()` | `Recommendation \| null` | Run the matching algorithm |
| `api.getDeckState()` | `DeckState` | Current deck state |
| `api.checkForUpdates()` | `{ available: boolean }` | Check for app updates |
| `api.installUpdate()` | `void` | Install and restart |
| `api.openExternal(url)` | `void` | Open URL in system browser |

### Subscribing to Events

Events are pushed from the main process. Subscribe in `useEffect` and always return the cleanup function.

```tsx
useEffect(() => {
  const unsub = api.onDeckStateChanged((data) => {
    const state = data as DeckState
    setDeckState(state)
  })
  return unsub
}, [])
```

| Event Subscription | Payload Type | When It Fires |
|---|---|---|
| `api.onLibraryScanProgress(cb)` | `LibraryScanProgress` | During library scan (progress + completion) |
| `api.onDeckStateChanged(cb)` | `DeckState` | When a new track is loaded in Serato |
| `api.onAuthStateChanged(cb)` | `AuthState` | After OAuth2 callback is received |
| `api.onUpdateAvailable(cb)` | `{ version, downloading }` | When a new version is detected |
| `api.onUpdateDownloaded(cb)` | `{ version }` | When update is ready to install |
| `api.onMenuRescan(cb)` | `void` | When Cmd+R or menu "Re-scan Library" is selected |
| `api.onMenuCheckUpdates(cb)` | `void` | When menu "Check for Updates" is selected |

---

## 7. Navigation

The app has two full-window states and one overlay:

- `'auth'` — Auth Screen (no token)
- `'main'` — Main View (authenticated, subscribed, library loaded)
- Settings Panel — overlay on Main View (not a separate route)

Navigation state is managed in `App.tsx` via `useState<'auth' | 'main'>`. The builder should:

1. On mount: call `api.getAuthState()`. If authenticated, move to `'main'`. If not, stay on `'auth'`.
2. Listen for `api.onAuthStateChanged()` to handle OAuth2 callback.
3. After auth success: call `api.validateSubscription()` then `api.scanLibrary()`.
4. Subscription expired: show expiry overlay on the Main View (not a separate route).
5. Settings Panel: toggled by state in `App.tsx` or `MainView.tsx`.

**There is no React Router.** No URL-based routing. The app is a state machine.

---

## 8. State Management

Use React's built-in state management:
- `useState` for local component state
- `useEffect` for IPC event subscriptions and side effects
- Lift state up to `App.tsx` for app-level state (auth, library, deck state)
- Pass state down as props

No external state library (Zustand, Redux, etc.) is needed. The app has a small state surface:
- Auth state (from IPC)
- Subscription status (from IPC)
- Library index (from IPC)
- Deck state (from IPC events)
- Current recommendation (from IPC invoke)
- Settings panel open/closed (local state)

---

## 9. Error Handling

### Error State Pattern

The main process sends typed errors via IPC. Display them using this consistent pattern:

```tsx
// Per Brand Kit voice: DJ-fluent, booth-ready, no filler
<div style={{ textAlign: 'center' }}>
  <h2 style={{ ...typeScale.settingsName, color: colors.text, marginBottom: spacing.sm }}>
    {error.headline}
  </h2>
  <p style={{ ...typeScale.bodyXs, color: colors.textSecondary, marginBottom: spacing['2xl'] }}>
    {error.body}
  </p>
  {error.retryable && (
    <Button variant="primary" onClick={handleRetry}>
      Try Again
    </Button>
  )}
</div>
```

### Error Types (from `src/shared/types.ts`)

| Type | When | Headline |
|---|---|---|
| `serato-not-found` | Serato library directory missing | "No Serato library found." |
| `serato-parse-error` | Database file corrupt/unreadable | "Couldn't read your Serato library." |
| `network-error` | No internet on launch | "No internet connection." |
| `subscription-api-error` | API returns 5xx or bad format | "Something went wrong." |
| `auth-error` | OAuth2 failure | "Sign-in failed." |

---

## 10. Accessibility

Per PRD F12, the builder must:

1. **Tab order:** Tab cycles between interactive elements: Recommendation button, Gear icon. Within Settings: Re-scan, Check for Updates, Sign Out, Close.
2. **aria-labels:** All interactive elements need descriptive labels:
   - Recommendation button: `aria-label="Drop a heater. Press to get a track recommendation."`
   - Disabled: `aria-label="Drop a heater. Disabled. No deck loaded."`
3. **Live regions:** Now Playing section uses `aria-live="polite"`. Status messages use `aria-live="assertive"`.
4. **VoiceOver announcements:** When a recommendation appears, announce the full result.
5. **Focus indicators:** Handled by `global.css` — 2px Flame outline with 3px offset. Don't override.
6. **Reduced motion:** Handled by `global.css` media query. For JS-driven animations, check:

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

---

## 11. Brand Voice in UI Copy

All user-facing strings follow the Brand Kit voice attributes:

- **Booth-Ready:** Assume the DJ has 5 seconds. No filler.
- **Show-the-Math:** Reveal reasoning with numbers.
- **DJ-Fluent:** Use DJ terminology (Camelot, BPM, crates, decks).
- **Confident, Not Cocky:** Assured but never arrogant.
- **Respect-the-Library:** The DJ's library is sacred.

**Examples from the PRD:**
- "Library loaded. 2,847 tracks indexed." (not "Welcome! Your library has been successfully loaded.")
- "No compatible tracks in your library for this key and BPM range." (not "Sorry, we couldn't find any matching songs.")
- "Track not in your scanned library. Re-scan to include recent additions." (not "Oops! It looks like this track wasn't found.")

---

## 12. Fonts

Fonts are bundled in `assets/fonts/` as woff2 files and loaded via `@font-face` in `global.css`. The builder does not need to install or load fonts — they are already configured.

**Available fonts:**
- Inter: weights 400, 500, 600, 700, 800, 900
- IBM Plex Mono: weights 400, 500, 600

**Never use raw font family strings.** Always use the `typeScale` or `fontFamily` tokens from `design-tokens/typography.ts`.

---

## 13. Adding Dependencies

If you need a new npm dependency:
1. Add it to `package.json` (in `dependencies` or `devDependencies` as appropriate).
2. Run `npm install`.
3. Import it normally.

Do not restructure the existing `package.json` scripts or build configuration.

---

## 14. Commit Conventions

Commit messages use this format:

```
<type>: <description>

<optional body>
```

Types:
- `feat` — new feature or screen implementation
- `fix` — bug fix
- `refactor` — code change that doesn't add a feature or fix a bug
- `style` — visual/styling changes only
- `chore` — dependency updates, config changes

Examples:
- `feat: implement auth screen with DJ ID OAuth2 flow`
- `feat: add recommendation card with transparency display`
- `fix: deck state not clearing previous recommendation`

Keep commits focused. One feature or fix per commit.
