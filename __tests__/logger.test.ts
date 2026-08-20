import { logger } from '@/lib/logger'
import { db } from '@/lib/db'

describe('Phase 4: Structured Logging, PII Redaction & Health Audit Tests', () => {
  it('generates structured JSON log entries with proper levels and timestamps', () => {
    const entry = logger.info('ORDER_PLACED', 'Client placed order #ord_123', {
      userId: 'c1',
      orderId: 'ord_123',
      amount: 450,
      currency: 'TND',
    })

    expect(entry.level).toBe('INFO')
    expect(entry.event).toBe('ORDER_PLACED')
    expect(entry.message).toContain('ord_123')
    expect(entry.context.amount).toBe(450)
    expect(entry.context.currency).toBe('TND')
    expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0)
  })

  it('redacts sensitive fields like passwords, tokens, signatures, and credit cards', () => {
    const entry = logger.security('AUTH_ATTEMPT', 'User login attempt', {
      userId: 'c1',
      password: 'superSecretPassword123!',
      token: 'jwt.token.secret',
      signature: 'hmac_sha256_signature',
      creditCard: '4111222233334444',
      safeField: 'validPublicData',
    })

    expect(entry.context.password).toBe('[REDACTED]')
    expect(entry.context.token).toBe('[REDACTED]')
    expect(entry.context.signature).toBe('[REDACTED]')
    expect(entry.context.creditCard).toBe('[REDACTED]')
    expect(entry.context.safeField).toBe('validPublicData')
  })

  it('records AUDIT, SECURITY, and ERROR events into the database audit trail', async () => {
    const initialLogs = await db.auditLog.findMany({})
    const initialCount = initialLogs.length

    logger.audit('ESCROW_MANUAL_ADJUSTMENT', 'Admin adjusted escrow release', {
      userId: 'admin1',
      orderId: 'ord_audit_test',
      amount: 100,
    })

    const updatedLogs = await db.auditLog.findMany({})
    expect(updatedLogs.length).toBeGreaterThan(initialCount)

    const latest = updatedLogs[0]
    expect(latest.action).toBe('ESCROW_MANUAL_ADJUSTMENT')
  })
})
