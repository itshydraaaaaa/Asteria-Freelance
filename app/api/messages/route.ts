import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/messages?partnerId=[id] — Load conversation history & active contacts
 * POST /api/messages — Send a new message or custom offer
 */

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId') || searchParams.get('user')

    // 1. Fetch all messages involving the current user
    const allUserMessages = await db.message.findMany({
      where: { userId: currentUserId },
    })

    // 2. Extract unique partner IDs
    const partnerIds = new Set<string>()
    allUserMessages.forEach(m => {
      if (m.senderId !== currentUserId) partnerIds.add(m.senderId)
      if (m.receiverId !== currentUserId) partnerIds.add(m.receiverId)
    })

    if (partnerId && partnerId !== currentUserId) {
      partnerIds.add(partnerId)
    }

    // 3. Fetch user details for each partner
    const allUsers = await db.user.findMany()
    const partners = Array.from(partnerIds).map(pid => {
      const user = allUsers.find(u => u.id === pid)
      const lastMsg = allUserMessages
        .filter(m => (m.senderId === pid && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === pid))
        .pop()

      return {
        id: pid,
        name: user?.name ?? `User (${pid.slice(0, 6)})`,
        email: user?.email ?? '',
        role: user?.role ?? 'FREELANCER',
        avatar: user?.name?.[0] ?? 'U',
        image: user?.image,
        lastMessage: lastMsg?.content ?? (lastMsg?.msgType === 'CUSTOM_OFFER' ? 'Custom Offer' : 'Conversation started'),
        lastTime: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        unread: allUserMessages.filter(m => m.senderId === pid && m.receiverId === currentUserId && !m.isRead).length,
      }
    })

    // If partnerId is provided, filter messages for that active conversation
    const activeMessages = partnerId
      ? allUserMessages.filter(
          m =>
            (m.senderId === currentUserId && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === currentUserId)
        )
      : []

    return NextResponse.json({
      currentUserId,
      partners,
      messages: activeMessages,
    })
  } catch (err: any) {
    console.error('GET /api/messages error:', err)
    return NextResponse.json({ error: err.message || 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const senderId = session.user.id
    const body = await req.json()
    const { receiverId, content, msgType = 'TEXT', offerData } = body

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

    if (!content && !offerData) {
      return NextResponse.json({ error: 'Message content or offer data is required' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content: content || (msgType === 'CUSTOM_OFFER' ? `Custom Offer: ${offerData?.title}` : ''),
        msgType,
        offerData: offerData ?? null,
      },
    })

    return NextResponse.json({
      message,
      success: true,
    }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/messages error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 })
  }
}
