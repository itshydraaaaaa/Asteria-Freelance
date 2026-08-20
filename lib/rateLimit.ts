/**
 * lib/rateLimit.ts — Asteria Per-User & Auth Rate Limiting and Account Lockout
 *
 * DB-backed rate limiter using rate_limit_log table with high-performance in-memory
 * sliding window fallback.
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('placeholder') || key === 'placeholder') return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

interface RateLimitOptions {
  limit: number       // max requests allowed in the window
  windowSecs: number  // sliding window in seconds
}

export const RATE_LIMITS: Record<string, RateLimitOptions> = {
  '/api/auth/login':          { limit: 5,  windowSecs: 60 },
  '/api/auth/register':       { limit: 3,  windowSecs: 60 },
  '/api/auth/reset-password': { limit: 3,  windowSecs: 300 },
  '/api/jobs':                { limit: 5,  windowSecs: 60 },
  '/api/proposals':           { limit: 10, windowSecs: 60 },
  '/api/reviews':             { limit: 3,  windowSecs: 60 },
  '/api/messages/offer':      { limit: 15, windowSecs: 60 },
  '/api/orders':              { limit: 10, windowSecs: 60 },
}

// In-memory tracking for rate limiting & account lockout
const memoryLog: { key: string; timestamp: number }[] = []
const failedLoginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_SECS = 15 * 60 // 15 minutes

/**
 * Checks if an account is temporarily locked due to consecutive failed logins.
 */
export function checkAccountLockout(email: string): { locked: boolean; retryAfterSecs?: number } {
  const normalized = email.toLowerCase().trim()
  const record = failedLoginAttempts.get(normalized)
  if (!record) return { locked: false }

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const retryAfterSecs = Math.ceil((record.lockedUntil - Date.now()) / 1000)
    return { locked: true, retryAfterSecs }
  }

  // If lockout expired, clear
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    failedLoginAttempts.delete(normalized)
    return { locked: false }
  }

  return { locked: false }
}

/**
 * Records a failed login attempt for an email and triggers lockout if threshold reached.
 */
export function recordFailedLogin(email: string): { locked: boolean; attemptsLeft: number; retryAfterSecs?: number } {
  const normalized = email.toLowerCase().trim()
  const record = failedLoginAttempts.get(normalized) || { count: 0 }
  record.count += 1

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_SECS * 1000
    failedLoginAttempts.set(normalized, record)
    return { locked: true, attemptsLeft: 0, retryAfterSecs: LOCKOUT_DURATION_SECS }
  }

  failedLoginAttempts.set(normalized, record)
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - record.count }
}

/**
 * Resets failed login attempt counter upon successful login.
 */
export function resetFailedLogins(email: string): void {
  failedLoginAttempts.delete(email.toLowerCase().trim())
}

/**
 * Returns a 429 NextResponse if rate limit exceeded.
 */
export async function rateLimit(
  userId: string,
  endpoint: string,
  opts?: RateLimitOptions
): Promise<NextResponse | null> {
  const options = opts ?? RATE_LIMITS[endpoint]
  if (!options) return null

  const now = Date.now()
  const windowStart = now - options.windowSecs * 1000

  // 1. Check Supabase DB if available
  try {
    const supabase = getServiceClient()
    if (supabase) {
      const windowStartIso = new Date(windowStart).toISOString()
      const { count, error } = await supabase
        .from('rate_limit_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gte('created_at', windowStartIso)

      if (!error && (count ?? 0) >= options.limit) {
        return NextResponse.json(
          {
            error: 'Too many requests. Please wait before trying again.',
            retryAfterSecs: options.windowSecs,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(options.windowSecs),
              'X-RateLimit-Limit': String(options.limit),
            },
          }
        )
      }

      await supabase.from('rate_limit_log').insert({ user_id: userId, endpoint })
      return null
    }
  } catch {}

  // 2. In-memory sliding window fallback
  const logKey = `${userId}:${endpoint}`
  // Clean old entries
  while (memoryLog.length > 0 && memoryLog[0].timestamp < now - 3600 * 1000) {
    memoryLog.shift()
  }

  const recentCount = memoryLog.filter(e => e.key === logKey && e.timestamp >= windowStart).length
  if (recentCount >= options.limit) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before trying again.',
        retryAfterSecs: options.windowSecs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(options.windowSecs),
          'X-RateLimit-Limit': String(options.limit),
        },
      }
    )
  }

  memoryLog.push({ key: logKey, timestamp: now })
  return null
}
