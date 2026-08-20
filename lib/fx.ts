/**
 * lib/fx.ts — Asteria Live Foreign Exchange (FX) Rate Service
 *
 * Provides:
 * 1. Live TND <-> USD exchange rates with a 1-hour in-memory cache TTL.
 * 2. Audit-logged Admin Manual Override path for volatile market conditions.
 * 3. Exact applied exchange rate tracking for financial ledger entries.
 */

import 'server-only'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

interface FxRateState {
  rate: number
  source: 'LIVE' | 'CACHE' | 'OVERRIDE' | 'FALLBACK'
  fetchedAt: number
  overrideBy?: string
  overrideReason?: string
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour TTL
const DEFAULT_TND_TO_USD = 0.32

let cachedFxState: FxRateState = {
  rate: parseFloat(process.env.TND_TO_USD_RATE || String(DEFAULT_TND_TO_USD)),
  source: 'FALLBACK',
  fetchedAt: 0,
}

let adminOverrideState: FxRateState | null = null

/**
 * Retrieves the current TND -> USD exchange rate, honoring overrides, cache TTL, and live fetching.
 */
export async function getTndToUsdRate(): Promise<{
  rate: number
  source: 'LIVE' | 'CACHE' | 'OVERRIDE' | 'FALLBACK'
  fetchedAt: string
  overrideReason?: string
}> {
  const now = Date.now()

  // 1. Check if an active Admin Override is set
  if (adminOverrideState) {
    return {
      rate: adminOverrideState.rate,
      source: 'OVERRIDE',
      fetchedAt: new Date(adminOverrideState.fetchedAt).toISOString(),
      overrideReason: adminOverrideState.overrideReason,
    }
  }

  // 2. Check in-memory cache validity
  if (cachedFxState.fetchedAt > 0 && now - cachedFxState.fetchedAt < CACHE_TTL_MS) {
    return {
      rate: cachedFxState.rate,
      source: 'CACHE',
      fetchedAt: new Date(cachedFxState.fetchedAt).toISOString(),
    }
  }

  // 3. Attempt Live Fetch from FX Provider
  try {
    const fxApiUrl = process.env.FX_API_URL || 'https://api.exchangerate-api.com/v4/latest/TND'
    const res = await fetch(fxApiUrl, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Asteria-Freelance-FX/1.0' },
    })

    if (res.ok) {
      const data = await res.json()
      const liveUsdRate = data?.rates?.USD

      if (typeof liveUsdRate === 'number' && liveUsdRate > 0.1 && liveUsdRate < 1.0) {
        cachedFxState = {
          rate: Math.round(liveUsdRate * 10000) / 10000,
          source: 'LIVE',
          fetchedAt: now,
        }

        logger.audit('FX_RATE_REFRESHED', `Live TND/USD exchange rate updated to ${cachedFxState.rate}`, {
          rate: cachedFxState.rate,
          source: 'LIVE',
        })

        return {
          rate: cachedFxState.rate,
          source: 'LIVE',
          fetchedAt: new Date(now).toISOString(),
        }
      }
    }
  } catch (err: any) {
    logger.warn('FX_LIVE_FETCH_FAILED', `Failed to fetch live FX rate, using fallback: ${err.message}`)
  }

  // 4. Fallback if live fetch failed
  cachedFxState = {
    rate: parseFloat(process.env.TND_TO_USD_RATE || String(DEFAULT_TND_TO_USD)),
    source: 'FALLBACK',
    fetchedAt: now,
  }

  return {
    rate: cachedFxState.rate,
    source: 'FALLBACK',
    fetchedAt: new Date(now).toISOString(),
  }
}

/**
 * Sets a manual Admin FX rate override and records an immutable audit log.
 */
export async function setAdminFxOverride(
  rate: number,
  adminId: string,
  adminName: string,
  reason: string
): Promise<{ success: boolean; rate: number }> {
  if (isNaN(rate) || rate <= 0 || rate > 2.0) {
    throw new Error('Invalid exchange rate override. Must be a positive number between 0.01 and 2.0')
  }

  const previousRate = adminOverrideState ? adminOverrideState.rate : cachedFxState.rate

  adminOverrideState = {
    rate: Math.round(rate * 10000) / 10000,
    source: 'OVERRIDE',
    fetchedAt: Date.now(),
    overrideBy: adminId,
    overrideReason: reason,
  }

  // Log in immutable audit trail
  await db.auditLog.create({
    data: {
      adminId,
      adminName,
      action: 'ADMIN_FX_OVERRIDE_SET',
      details: `Admin ${adminName} set manual TND/USD FX override to ${adminOverrideState.rate} (Previous: ${previousRate}). Reason: ${reason}`,
    },
  })

  logger.security('ADMIN_FX_OVERRIDE_SET', `Admin #${adminId} set FX rate to ${adminOverrideState.rate}`, {
    adminId,
    adminName,
    rate: adminOverrideState.rate,
    reason,
  })

  return { success: true, rate: adminOverrideState.rate }
}

/**
 * Clears the manual Admin FX rate override and returns to live/cached rates.
 */
export async function clearAdminFxOverride(adminId: string, adminName: string): Promise<{ success: boolean }> {
  if (adminOverrideState) {
    const clearedRate = adminOverrideState.rate
    adminOverrideState = null

    await db.auditLog.create({
      data: {
        adminId,
        adminName,
        action: 'ADMIN_FX_OVERRIDE_CLEARED',
        details: `Admin ${adminName} cleared manual FX override (was ${clearedRate}). Restored live FX provider.`,
      },
    })
  }

  return { success: true }
}
