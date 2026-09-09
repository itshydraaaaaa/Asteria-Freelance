/**
 * lib/idempotency.ts — Request Idempotency Guard
 *
 * Prevents double-charge / double-release on fund-moving endpoints.
 */

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export interface IdempotencyRecord {
  idempotencyKey: string
  endpoint: string
  result: any
  createdAt: Date
}

const memoryIdempotencyStore = new Map<string, { endpoint: string; result: any; expiresAt: number; createdAt: Date }>()

export function clearMemoryIdempotencyStore() {
  memoryIdempotencyStore.clear()
}

// ─── check ────────────────────────────────────────────────────────────────────
export async function check(
  key: string,
  endpoint: string
): Promise<IdempotencyRecord | null> {
  if (!key || key.length < 8) return null

  // 1. Check in-memory store
  const cachedMem = memoryIdempotencyStore.get(key)
  if (cachedMem && cachedMem.endpoint === endpoint && cachedMem.expiresAt > Date.now()) {
    return {
      idempotencyKey: key,
      endpoint: cachedMem.endpoint,
      result: cachedMem.result,
      createdAt: cachedMem.createdAt,
    }
  }

  // 2. Query canonical idempotency_keys table
  try {
    const supabase = getServiceClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('idempotency_keys')
        .select('*')
        .eq('key', key)
        .eq('endpoint', endpoint)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!error && data) {
        return {
          idempotencyKey: data.key,
          endpoint: data.endpoint,
          result: data.response,
          createdAt: new Date(data.created_at),
        }
      }

      // 3. Fallback to processed_requests
      const { data: legacyData, error: legacyErr } = await supabase
        .from('processed_requests')
        .select('*')
        .eq('idempotency_key', key)
        .eq('endpoint', endpoint)
        .single()

      if (!legacyErr && legacyData) {
        return {
          idempotencyKey: legacyData.idempotency_key,
          endpoint: legacyData.endpoint,
          result: legacyData.result,
          createdAt: new Date(legacyData.created_at),
        }
      }
    }
  } catch {}

  return null
}

// ─── save ─────────────────────────────────────────────────────────────────────
export async function save(
  key: string,
  endpoint: string,
  result: any,
  userId?: string
): Promise<void> {
  if (!key || key.length < 8) return

  const now = Date.now()
  const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours

  // 1. Cache in memory
  memoryIdempotencyStore.set(key, {
    endpoint,
    result,
    expiresAt,
    createdAt: new Date(now),
  })

  // 2. Persist to Supabase
  try {
    const supabase = getServiceClient()
    if (supabase) {
      await supabase
        .from('idempotency_keys')
        .upsert({
          key,
          endpoint,
          user_id: userId ?? null,
          response: result,
          expires_at: new Date(expiresAt).toISOString(),
        }, { onConflict: 'key' })

      await supabase
        .from('processed_requests')
        .upsert({
          idempotency_key: key,
          endpoint,
          user_id: userId ?? null,
          result,
        }, { onConflict: 'idempotency_key' })
    }
  } catch {}
}

// ─── withIdempotency ─────────────────────────────────────────────────────────
export async function withIdempotency<T>(
  key: string | null | undefined,
  endpoint: string,
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (key) {
    try {
      const cached = await check(key, endpoint)
      if (cached) return cached.result as T
    } catch {}
  }

  const result = await fn()

  if (key) {
    try {
      await save(key, endpoint, result, userId)
    } catch {}
  }

  return result
}
