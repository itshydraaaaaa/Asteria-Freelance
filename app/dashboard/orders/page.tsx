import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { OrdersOverviewClient } from '@/components/dashboard/OrdersOverviewClient'

export default async function OrdersPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let orders: any[] = []

  try {
    const buyerOrders = await db.order.findMany({
      where: { buyerId: userId },
      include: { gig: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const sellerOrders = await db.order.findMany({
      where: { sellerId: userId },
      include: { gig: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Combine and deduplicate
    const map = new Map()
    buyerOrders.forEach((o: any) => map.set(o.id, o))
    sellerOrders.forEach((o: any) => map.set(o.id, o))
    orders = Array.from(map.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  }

  return <OrdersOverviewClient userId={userId} orders={orders} />
}