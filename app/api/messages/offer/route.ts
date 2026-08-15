import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { recipientId, title, price, deliveryDays, description } = body

    if (!recipientId || !title || !price) {
      return NextResponse.json({ error: 'Missing required offer fields' }, { status: 400 })
    }

    // Create a new order in PENDING status for the custom offer
    const order = {
      id: `ord_custom_${Date.now()}`,
      gigId: 'custom',
      buyerId: recipientId,
      sellerId: userId,
      amount: parseFloat(price),
      status: 'PENDING' as const,
      createdAt: new Date(),
      gig: {
        title,
        description: description || 'Custom agreement negotiated in direct messages.',
        deliveryDays: parseInt(deliveryDays ?? 3, 10),
      }
    }

    return NextResponse.json({
      offer: {
        id: `offer_${Date.now()}`,
        orderId: order.id,
        title,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays ?? 3, 10),
        description,
        status: 'PENDING',
      },
      message: 'Custom offer sent successfully'
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/messages/offer error:', err)
    return NextResponse.json({ error: 'Failed to create custom offer' }, { status: 500 })
  }
}
