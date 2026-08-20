import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { creditWallet, debitWallet } from '@/lib/ledger'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Flouci Sandbox Payment Gateway Handler
 * Supports generating payment sessions and verifying webhook notifications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amount, orderId, userId, paymentId, signature } = body

    if (action === 'CREATE_PAYMENT') {
      const session = await auth()
      const effectiveUserId = session?.user?.id || userId
      if (!effectiveUserId || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid user ID and positive amount required' }, { status: 400 })
      }

      const paymentRef = `flouci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const trackingUrl = `https://sandbox.flouci.com/pay/${paymentRef}`

      return NextResponse.json({
        success: true,
        paymentRef,
        paymentUrl: trackingUrl,
        amount: Number(amount),
        currency: 'TND',
        gateway: 'FLOUCI_SANDBOX',
      }, { status: 200 })
    }

    if (action === 'VERIFY_WEBHOOK') {
      // Flouci Webhook Signature verification
      const secret = process.env.FLOUCI_APP_SECRET || 'asteria_flouci_sandbox_secret'
      const payloadString = `${paymentId}:${amount}:${orderId || ''}:${userId || ''}`
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

      if (signature && signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { status: 'ACTIVE' },
        })

        await db.auditLog.create({
          data: {
            adminId: 'system',
            adminName: 'Flouci Gateway',
            action: 'ESCROW_FUNDED_FLOUCI',
            targetId: orderId,
            details: `Order #${orderId} escrow successfully funded via Flouci (${amount} TND)`,
          },
        })
      } else if (userId && amount > 0) {
        await creditWallet(userId, Number(amount), 'DEPOSIT', {
          note: `Flouci Sandbox Wallet Deposit (Ref: ${paymentId})`,
          idempotencyKey: `flouci-deposit-${paymentId}`,
        })
      }

      return NextResponse.json({ verified: true, paymentId, status: 'SUCCESS' }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action. Supported: CREATE_PAYMENT, VERIFY_WEBHOOK' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/payments/flouci error:', err)
    return NextResponse.json({ error: err.message || 'Flouci gateway error' }, { status: 500 })
  }
}
