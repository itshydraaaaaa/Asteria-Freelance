/**
 * lib/validateUrl.ts — Deliverable URL Sanitization
 *
 * Validates URLs submitted as order deliverables.
 * Allowlist: http: and https: protocols only.
 * Blocks: javascript:, data:, ftp:, file:, blob:, and any other scheme.
 *
 * Usage:
 *   const error = validateDeliverableUrl(url)
 *   if (error) return NextResponse.json({ error }, { status: 400 })
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:']

/**
 * Validates a deliverable URL against the protocol allowlist.
 * Returns an error string if invalid, null if valid.
 */
export function validateDeliverableUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return 'Deliverable URL is required'
  }

  const trimmed = url.trim()

  if (trimmed.length === 0) {
    return 'Deliverable URL is required'
  }

  if (trimmed.length > 2048) {
    return 'Deliverable URL is too long (max 2048 characters)'
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'Deliverable URL is not a valid URL'
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return `Deliverable URL must use http or https. "${parsed.protocol}" is not allowed.`
  }

  // Block localhost in production (not in dev)
  if (
    process.env.NODE_ENV === 'production' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.endsWith('.local'))
  ) {
    return 'Deliverable URL must be a publicly accessible address'
  }

  return null
}

/**
 * Sanitize a URL for safe display — strips known dangerous schemes.
 * Use this as a defense-in-depth layer even after validateDeliverableUrl passes.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim())
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return '#'
    return parsed.href
  } catch {
    return '#'
  }
}
