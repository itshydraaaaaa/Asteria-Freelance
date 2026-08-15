import { NextRequest, NextResponse } from 'next/server'
import { auth }               from '@/lib/auth'
import { db }                 from '@/lib/db'
import { requireAdmin }       from '@/lib/authz'
import { processEscrowRefund, processEscrowRelease } from '@/lib/ledger'
import { withIdempotency }    from '@/lib/idempotency'

const DISPUTE_THRESHOLD_USD = parseFloat(process.env.DISPUTE_THRESHOLD_USD ?? '500')

/**
 * GET  /api/admin/reports/[id] — Full case dossier (ADMIN only)
 * POST /api/admin/reports/[id] — Resolve dispute (ADMIN only, maker-checker above threshold)
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    // ── Server-side authorization: ADMIN only ─────────────────────────────
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const report = await db.report.findUnique({ where: { id: params.id } })
    if (!report) return NextResponse.json({ error: 'Report case not found' }, { status: 404 })

    // ── Deal Logs ─────────────────────────────────────────────────────────
    let dealLogs = null
    if (report.targetType === 'ORDER' && report.targetId) {
      const order = await db.order.findUnique({ where: { id: report.targetId } })
      if (order) {
        const [buyer, seller] = await Promise.all([
          db.user.findUnique({ where: { id: order.buyerId } }),
          db.user.findUnique({ where: { id: order.sellerId } }),
        ])
        dealLogs = {
          orderId:   order.id,
          gigTitle:  order.gig?.title ?? `Order ${order.id}`,
          amount:    order.amount,
          status:    order.status,
          createdAt: order.createdAt,
          buyer:  buyer  ? { id: buyer.id,  name: buyer.name,  email: buyer.email,  walletBalance: buyer.walletBalance,  kyc: buyer.verifiedStatus }  : null,
          seller: seller ? { id: seller.id, name: seller.name, email: seller.email, walletBalance: seller.walletBalance, kyc: seller.verifiedStatus } : null,
        }
      }
    }

    // ── Real Chat Transcript ─────────────────────────────────────────────
    // Fetch actual messages between reporter and the other party
    let chatTranscript: any[] = []
    const buyer = dealLogs?.buyer
    const seller = dealLogs?.seller
    if (report.targetType === 'ORDER' && buyer && seller) {
      chatTranscript = await db.message.findMany({
        where: { userId: buyer.id }
      }).then(msgs => msgs
        .filter((m: any) =>
          (m.senderId === buyer.id && m.receiverId === seller.id) ||
          (m.senderId === seller.id && m.receiverId === buyer.id)
        )
        .map((m: any) => ({
          sender:  m.senderId === buyer.id ? buyer.name : seller.name,
          text:    m.content,
          time:    m.createdAt,
          msgType: m.msgType,
        }))
      ).catch(() => [])
    }

    const reporterProfile = await db.user.findUnique({ where: { id: report.reporterId } })

    // ── Audit Log: KYC_VIEWED for this case view ──────────────────────────
    await db.auditLog.create({
      data: {
        adminId:   session!.user.id,
        adminName: session!.user.name || 'Admin',
        action:    'CASE_VIEWED',
        targetId:  params.id,
        details:   `Admin viewed case dossier for report ${params.id}`,
      }
    }).catch(() => {})

    return NextResponse.json({
      report,
      dealLogs,
      chatTranscript,
      reporterProfile: reporterProfile ? {
        id:            reporterProfile.id,
        name:          reporterProfile.name,
        email:         reporterProfile.email,
        role:          reporterProfile.role,
        kyc:           reporterProfile.verifiedStatus,
        walletBalance: reporterProfile.walletBalance,
      } : null,
      // Maker-checker metadata: tells the UI if a second approval is required
      requiresSecondApproval: (dealLogs?.amount ?? 0) > DISPUTE_THRESHOLD_USD,
      disputeThreshold: DISPUTE_THRESHOLD_USD,
    })
  } catch (err) {
    console.error('GET /api/admin/reports/[id]:', err)
    return NextResponse.json({ error: 'Failed to fetch case dossier' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    // ── Server-side authorization: ADMIN only ─────────────────────────────
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const body = await req.json()
    const { action } = body as { action: 'REFUND_BUYER' | 'RELEASE_SELLER' | 'DISMISS' }

    if (!['REFUND_BUYER', 'RELEASE_SELLER', 'DISMISS'].includes(action)) {
      return NextResponse.json({ error: 'Invalid resolution action' }, { status: 400 })
    }

    const report = await db.report.findUnique({ where: { id: params.id } })
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      return NextResponse.json({ error: 'This report has already been resolved' }, { status: 409 })
    }

    // ── Maker-Checker for high-value disputes ────────────────────────────
    if (action !== 'DISMISS') {
      let order = null
      if (report.targetType === 'ORDER') {
        order = await db.order.findUnique({ where: { id: report.targetId } })
      }

      if (order && order.amount > DISPUTE_THRESHOLD_USD) {
        // Check if this admin already made the first approval
        if (report.status === 'PENDING') {
          // First admin — mark as pending second approval
          await db.report.update({
            where: { id: params.id },
            data: { status: 'PENDING_SECOND_APPROVAL' }
          })

          await db.auditLog.create({
            data: {
              adminId:   session!.user.id,
              adminName: session!.user.name || 'Admin',
              action:    'DISPUTE_FIRST_APPROVAL',
              targetId:  params.id,
              details:   `Admin approved ${action} for report ${params.id} (amount $${order.amount} > threshold $${DISPUTE_THRESHOLD_USD}). Awaiting second admin approval.`,
            }
          })

          return NextResponse.json({
            message: `First approval recorded. A second admin must confirm this action (amount $${order.amount} exceeds the $${DISPUTE_THRESHOLD_USD} threshold).`,
            requiresSecondApproval: true,
          })
        }
        // If status is PENDING_SECOND_APPROVAL — proceed (second admin)
      }
    }

    // ── Execute Resolution ────────────────────────────────────────────────
    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined

    const result = await withIdempotency(
      idempotencyKey,
      `/api/admin/reports/[id]:${action}`,
      session!.user.id,
      async () => {
        if (action === 'DISMISS') {
          await db.report.update({ where: { id: params.id }, data: { status: 'DISMISSED' } })
          return { message: 'Report dismissed. No escrow movement.' }
        }

        // Find order
        const order = await db.order.findUnique({ where: { id: report.targetId } })
        if (!order) return NextResponse.json({ error: 'Order not found for this dispute' }, { status: 404 })

        if (action === 'REFUND_BUYER') {
          await processEscrowRefund(order.id, order.buyerId, order.amount)
          await db.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
          await db.report.update({ where: { id: params.id }, data: { status: 'RESOLVED' } })

          const buyer = await db.user.findUnique({ where: { id: order.buyerId } })
          await db.auditLog.create({
            data: {
              adminId:   session!.user.id,
              adminName: session!.user.name || 'Admin',
              action:    'ESCROW_REFUND',
              targetId:  params.id,
              details:   `Refunded $${order.amount} to buyer ${buyer?.name} for order ${order.id}. Report resolved.`,
            }
          })

          return { message: `Refunded $${order.amount} to buyer. Order cancelled. Report resolved.` }
        }

        if (action === 'RELEASE_SELLER') {
          const { sellerPayout } = await processEscrowRelease(order.id, order.sellerId, order.amount)
          await db.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } })
          await db.report.update({ where: { id: params.id }, data: { status: 'RESOLVED' } })

          const seller = await db.user.findUnique({ where: { id: order.sellerId } })
          await db.auditLog.create({
            data: {
              adminId:   session!.user.id,
              adminName: session!.user.name || 'Admin',
              action:    'ESCROW_RELEASE_ADMIN',
              targetId:  params.id,
              details:   `Released $${sellerPayout} to seller ${seller?.name} for order ${order.id}. Report resolved.`,
            }
          })

          return { message: `Released $${sellerPayout} to seller (85% net). Order completed. Report resolved.` }
        }
      }
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/admin/reports/[id]:', err)
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
  }
}
