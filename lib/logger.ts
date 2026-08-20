/**
 * lib/logger.ts — Asteria Structured Logger & Financial Audit Trail
 *
 * Provides structured JSON logging, PII redaction, and critical alerting
 * across all payment, escrow, KYC, and security-sensitive operations.
 */

import { db } from '@/lib/db'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT'

export interface LogContext {
  userId?: string
  orderId?: string
  milestoneId?: string
  amount?: number
  currency?: string
  endpoint?: string
  ip?: string
  idempotencyKey?: string
  gateway?: string
  error?: string | Error | any
  [key: string]: any
}

export interface StructuredLog {
  timestamp: string
  level: LogLevel
  event: string
  message: string
  context: Record<string, any>
  environment: string
}

// Redact sensitive patterns (passwords, auth tokens, credit cards, bank secrets)
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'signature',
  'authorization',
  'cookie',
  'creditcard',
  'card',
  'cvv',
  'accountkey',
  'rib',
])

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(sanitize)
  }

  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      clean[k] = '[REDACTED]'
    } else if (v instanceof Error) {
      clean[k] = { message: v.message, stack: v.stack }
    } else if (typeof v === 'object') {
      clean[k] = sanitize(v)
    } else {
      clean[k] = v
    }
  }
  return clean
}

export const logger = {
  log(level: LogLevel, event: string, message: string, context: LogContext = {}) {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      context: sanitize(context),
      environment: process.env.NODE_ENV || 'development',
    }

    const json = JSON.stringify(entry)

    switch (level) {
      case 'ERROR':
      case 'SECURITY':
        console.error(`[${level}] ${event}: ${message}`, json)
        break
      case 'WARN':
        console.warn(`[WARN] ${event}: ${message}`, json)
        break
      default:
        console.log(`[${level}] ${event}: ${message}`, json)
        break
    }

    // Automatically persist critical financial, KYC, or security audits
    if (level === 'AUDIT' || level === 'SECURITY' || level === 'ERROR') {
      db.auditLog.create({
        data: {
          adminId: context.userId || 'system',
          adminName: `${level} Logger`,
          action: event,
          targetId: context.orderId || context.milestoneId || context.userId || undefined,
          details: `${message} | Context: ${JSON.stringify(sanitize(context))}`,
        },
      }).catch(() => {})
    }

    // Trigger webhook alert on critical security/payment errors if configured
    if ((level === 'ERROR' || level === 'SECURITY') && process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **Asteria Alert [${level}]**: \`${event}\`\n**Message**: ${message}\n**Context**: \`\`\`json\n${JSON.stringify(sanitize(context), null, 2)}\n\`\`\``,
        }),
      }).catch(() => {})
    }

    return entry
  },

  info(event: string, message: string, context?: LogContext) {
    return this.log('INFO', event, message, context)
  },

  warn(event: string, message: string, context?: LogContext) {
    return this.log('WARN', event, message, context)
  },

  error(event: string, message: string, context?: LogContext) {
    return this.log('ERROR', event, message, context)
  },

  audit(event: string, message: string, context?: LogContext) {
    return this.log('AUDIT', event, message, context)
  },

  security(event: string, message: string, context?: LogContext) {
    return this.log('SECURITY', event, message, context)
  },
}
