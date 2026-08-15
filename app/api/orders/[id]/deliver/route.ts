import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { deliverableUrl, notes } = body

    if (!deliverableUrl) {
      return NextResponse.json({ error: 'Deliverable file link/URL is required' }, { status: 400 })
    }

    const order = await db.order.update({
      where: { id: params.id },
      data: {
        status: 'PENDING', // Work delivered, pending client approval
      }
    })

    return NextResponse.json({ order, message: 'Work deliverable submitted for buyer approval' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to submit deliverable' }, { status: 500 })
  }
}
