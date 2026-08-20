/**
 * lib/rateLimit.ts — Asteria Dual-Layer Rate Limiting, IP Protection & Account Lockout
 *
 * Provides:
 * 1. IP-based sliding window rate limiting (defends against credential stuffing).
 * 2. Account-based failed login tracking with progressive CAPTCHA trigger and lockout.
 * 3. Null-safe guards across all operations.
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
  '/api/ai/generate':         { limit: 20, windowSecs: 86400 },
}

// In-memory tracking for rate limiting & account lockout
const memoryLog: { key: string; timestamp: number }[] = []
const ipMemoryLog: { key: string; timestamp: number }[] = []
const failedLoginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map()

const CAPTCHA_TRIGGER_ATTEMPTS = 3
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_SECS = 15 * 60 // 15 minutes

/**
 * Checks if an account is temporarily locked or requires CAPTCHA verification due to failed logins.
 */
export function checkAccountLockout(email?: string | null): { locked: boolean; requireCaptcha: boolean; retryAfterSecs?: number; attemptsLeft?: number } {
  if (!email || typeof email !== 'string') return { locked: false, requireCaptcha: false }

  const normalized = email.toLowerCase().trim()
  const record = failedLoginAttempts.get(normalized)
  if (!record) return { locked: false, requireCaptcha: false }

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const retryAfterSecs = Math.ceil((record.lockedUntil - Date.now()) / 1000)
    return { locked: true, requireCaptcha: true, retryAfterSecs, attemptsLeft: 0 }
  }

  // If lockout expired, clear
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    failedLoginAttempts.delete(normalized)
    return { locked: false, requireCaptcha: false }
  }

  const requireCaptcha = (record.count ?? 0) >= CAPTCHA_TRIGGER_ATTEMPTS
  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - (record.count ?? 0))

  return { locked: false, requireCaptcha, attemptsLeft }
}

/**
 * Records a failed login attempt for an email and triggers progressive defense.
 */
export function recordFailedLogin(email?: string | null): { locked: boolean; requireCaptcha: boolean; attemptsLeft: number; retryAfterSecs?: number } {
  if (!email || typeof email !== 'string') return { locked: false, requireCaptcha: false, attemptsLeft: MAX_FAILED_ATTEMPTS }

  const normalized = email.toLowerCase().trim()
  const record = failedLoginAttempts.get(normalized) || { count: 0 }
  record.count += 1

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_SECS * 1000
    failedLoginAttempts.set(normalized, record)
    return { locked: true, requireCaptcha: true, attemptsLeft: 0, retryAfterSecs: LOCKOUT_DURATION_SECS }
  }

  failedLoginAttempts.set(normalized, record)
  const requireCaptcha = record.count >= CAPTCHA_TRIGGER_ATTEMPTS
  return { locked: false, requireCaptcha, attemptsLeft: MAX_FAILED_ATTEMPTS - record.count }
}

/**
 * Resets failed login attempt counter upon successful login.
 */
export function resetFailedLogins(email?: string | null): void {
  if (!email || typeof email !== 'string') return
  failedLoginAttempts.delete(email.toLowerCase().trim())
}

/**
 * IP-based sliding window rate limiter to defend against distributed credential stuffing.
 */
export async function rateLimitByIp(
  ip: string | null | undefined,
  endpoint: string,
  opts: RateLimitOptions = { limit: 20, windowSecs: 60 }
): Promise<NextResponse | null> {
  const cleanIp = ip ? String(ip) : '127.0.0.1'
  const now = Date.now()
  const windowStart = now - opts.windowSecs * 1000
  const logKey = `ip:${cleanIp}:${endpoint}`

  while (ipMemoryLog.length > 0 && ipMemoryLog[0].timestamp < now - 3600 * 1000) {
    ipMemoryLog.shift()
  }

  const recentCount = ipMemoryLog.filter(e => e.key === logKey && e.timestamp >= windowStart).length
  if (recentCount >= opts.limit) {
    return NextResponse.json(
      {
        error: 'Too many requests from this network. Please slow down and try again.',
        retryAfterSecs: opts.windowSecs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(opts.windowSecs),
          'X-RateLimit-Limit': String(opts.limit),
        },
      }
    )
  }

  ipMemoryLog.push({ key: logKey, timestamp: now })
  return null
}

/**
 * Returns a 429 NextResponse if user/endpoint rate limit exceeded.
 */
export async function rateLimit(
  userId?: string | null,
  endpoint?: string | null,
  opts?: RateLimitOptions
): Promise<NextResponse | null> {
  const cleanUserId = userId ? String(userId) : 'anon'
  const cleanEndpoint = endpoint ? String(endpoint) : 'default'

  const options = opts ?? RATE_LIMITS[cleanEndpoint]
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
        .eq('user_id', cleanUserId)
        .eq('endpoint', cleanEndpoint)
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

      await supabase.from('rate_limit_log').insert({ user_id: cleanUserId, endpoint: cleanEndpoint })
      return null
    }
  } catch {}

  // 2. In-memory sliding window fallback
  const logKey = `${cleanUserId}:${cleanEndpoint}`
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
