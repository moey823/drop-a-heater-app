// ============================================================
// Subscription Validation
// ============================================================
// Validates the DJ's subscription status by calling the marketing
// site API. Called on every launch after authentication.
//
// Per PRD F2: No local cache or grace period. No internet = no activation.
// Per PRD: No library data is included in the request. Only the DJ ID token.

import { SUBSCRIPTION_API } from '@shared/constants'
import type { SubscriptionStatus } from '@shared/types'
import { getAccessToken, refreshToken } from '../auth/oauth'

/**
 * Validate the DJ's subscription status against the marketing site API.
 *
 * @returns SubscriptionStatus
 * @throws Error if the API is unreachable or returns an unexpected format
 */
export async function validateSubscription(): Promise<SubscriptionStatus> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('No access token available')
  }

  const url = `${SUBSCRIPTION_API.baseUrl}${SUBSCRIPTION_API.validatePath}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    throw new SubscriptionNetworkError(
      err instanceof Error ? err.message : 'Network request failed'
    )
  }

  // Handle 401 — attempt token refresh and retry once
  if (response.status === 401) {
    const refreshed = await refreshToken()
    if (!refreshed) {
      throw new SubscriptionAuthError('Token refresh failed')
    }

    const newToken = getAccessToken()
    if (!newToken) {
      throw new SubscriptionAuthError('No token after refresh')
    }

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      throw new SubscriptionNetworkError(
        err instanceof Error ? err.message : 'Network request failed on retry'
      )
    }

    if (response.status === 401) {
      throw new SubscriptionAuthError('Token invalid after refresh')
    }
  }

  // Handle server errors
  if (response.status >= 500) {
    throw new SubscriptionApiError(`Server error: ${response.status}`)
  }

  if (!response.ok) {
    throw new SubscriptionApiError(`Unexpected status: ${response.status}`)
  }

  // Parse response
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new SubscriptionApiError('Invalid response format')
  }

  // Validate response shape
  if (!data || typeof data !== 'object') {
    throw new SubscriptionApiError('Invalid response format')
  }

  const body = data as Record<string, unknown>
  const status = body.status
  const expiresAt = body.expires_at

  if (status !== 'active' && status !== 'expired' && status !== 'not_found') {
    throw new SubscriptionApiError(`Unknown status: ${status}`)
  }

  return {
    status: status as SubscriptionStatus['status'],
    expiresAt: typeof expiresAt === 'string' ? expiresAt : null,
  }
}

/** Network error during subscription validation */
export class SubscriptionNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionNetworkError'
  }
}

/** Auth error during subscription validation */
export class SubscriptionAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionAuthError'
  }
}

/** API error during subscription validation */
export class SubscriptionApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionApiError'
  }
}
