// ============================================================
// DJ ID OAuth2 Flow
// ============================================================
// Handles the OAuth2 Authorization Code grant flow with DJ ID (djid.me).
// The flow:
//   1. App opens system browser to djid.me authorization endpoint
//   2. DJ signs in on djid.me
//   3. djid.me redirects to dropaheater://auth/callback?code=...
//   4. App receives the code via custom URL scheme handler
//   5. App exchanges the code for tokens (server-side call)
//   6. Tokens stored in macOS Keychain
//
// Token storage uses macOS Keychain via Electron's safeStorage API.

import { shell, safeStorage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { DJID_OAUTH, KEYCHAIN_SERVICE } from '@shared/constants'
import type { AuthState } from '@shared/types'

/** Path to store encrypted tokens */
const TOKEN_STORE_PATH = path.join(os.homedir(), '.drop-a-heater-auth')

interface StoredTokens {
  accessToken: string
  refreshToken: string
  userDisplayName: string
  userEmail: string
  expiresAt: number
}

/**
 * Open the DJ ID authorization page in the system browser.
 */
export async function startOAuthFlow(): Promise<void> {
  const params = new URLSearchParams({
    client_id: DJID_OAUTH.clientId,
    redirect_uri: DJID_OAUTH.redirectUri,
    response_type: 'code',
    scope: DJID_OAUTH.scopes.join(' '),
  })

  const authUrl = `${DJID_OAUTH.authorizeUrl}?${params.toString()}`
  await shell.openExternal(authUrl)
}

/**
 * Handle the OAuth2 callback URL.
 * Extracts the authorization code and exchanges it for tokens.
 *
 * @param callbackUrl — the full dropaheater://auth/callback?code=... URL
 * @returns AuthState on success
 * @throws Error on failure
 */
export async function handleOAuthCallback(callbackUrl: string): Promise<AuthState> {
  const url = new URL(callbackUrl)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    throw new Error(`DJ ID authorization failed: ${error}`)
  }

  if (!code) {
    throw new Error('No authorization code received from DJ ID')
  }

  // Exchange code for tokens
  const tokenResponse = await fetch(DJID_OAUTH.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: DJID_OAUTH.redirectUri,
      client_id: DJID_OAUTH.clientId,
    }).toString(),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokenResponse.status}`)
  }

  const tokenData = await tokenResponse.json()

  // Store tokens securely
  const tokens: StoredTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    userDisplayName: tokenData.user?.display_name ?? tokenData.name ?? 'DJ',
    userEmail: tokenData.user?.email ?? tokenData.email ?? '',
    expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
  }

  await storeTokens(tokens)

  return {
    isAuthenticated: true,
    userDisplayName: tokens.userDisplayName,
    userEmail: tokens.userEmail,
  }
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Called silently on subsequent launches.
 *
 * @returns AuthState if refresh succeeds, null if no stored tokens or refresh fails
 */
export async function refreshToken(): Promise<AuthState | null> {
  const tokens = loadTokens()
  if (!tokens) return null

  try {
    const response = await fetch(DJID_OAUTH.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: DJID_OAUTH.clientId,
      }).toString(),
    })

    if (!response.ok) {
      // Refresh failed — clear stored tokens
      clearTokens()
      return null
    }

    const tokenData = await response.json()

    const updatedTokens: StoredTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? tokens.refreshToken,
      userDisplayName: tokens.userDisplayName,
      userEmail: tokens.userEmail,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
    }

    await storeTokens(updatedTokens)

    return {
      isAuthenticated: true,
      userDisplayName: updatedTokens.userDisplayName,
      userEmail: updatedTokens.userEmail,
    }
  } catch {
    // Network error during refresh — don't clear tokens,
    // existing tokens may still work for the current session
    return {
      isAuthenticated: true,
      userDisplayName: tokens.userDisplayName,
      userEmail: tokens.userEmail,
    }
  }
}

/**
 * Get the current access token for API calls.
 */
export function getAccessToken(): string | null {
  const tokens = loadTokens()
  return tokens?.accessToken ?? null
}

/**
 * Get current auth state without making network calls.
 */
export function getAuthState(): AuthState {
  const tokens = loadTokens()
  if (!tokens) {
    return { isAuthenticated: false, userDisplayName: null, userEmail: null }
  }
  return {
    isAuthenticated: true,
    userDisplayName: tokens.userDisplayName,
    userEmail: tokens.userEmail,
  }
}

/**
 * Clear all stored tokens (sign out).
 */
export function clearTokens(): void {
  try {
    if (fs.existsSync(TOKEN_STORE_PATH)) {
      fs.unlinkSync(TOKEN_STORE_PATH)
    }
  } catch {
    // Best effort
  }
}

/**
 * Store tokens securely using Electron's safeStorage (encrypts with OS keychain).
 */
async function storeTokens(tokens: StoredTokens): Promise<void> {
  const json = JSON.stringify(tokens)

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json)
    fs.writeFileSync(TOKEN_STORE_PATH, encrypted)
  } else {
    // Fallback: store as plain JSON (not ideal, but better than failing)
    fs.writeFileSync(TOKEN_STORE_PATH, json, 'utf-8')
  }
}

/**
 * Load stored tokens.
 */
function loadTokens(): StoredTokens | null {
  try {
    if (!fs.existsSync(TOKEN_STORE_PATH)) return null

    const data = fs.readFileSync(TOKEN_STORE_PATH)

    let json: string
    if (safeStorage.isEncryptionAvailable()) {
      json = safeStorage.decryptString(data)
    } else {
      json = data.toString('utf-8')
    }

    return JSON.parse(json) as StoredTokens
  } catch {
    return null
  }
}
