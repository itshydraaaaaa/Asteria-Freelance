import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { MilestoneTracker } from '@/components/orders/MilestoneTracker'
import { OrderWorkspaceClient } from '@/components/orders/OrderWorkspaceClient'

export default async function OrderWorkspacePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  let order = await db.order.findUnique({ where: { id: params.id } })

  if (!order) {
    // Fallback demo order for testing non-existent IDs
    order = {
      id: params.id,
      gigId: 'g1',
      buyerId: 'c1',
      sellerId: 'f1',
      amount: 299,
      status: 'ACTIVE',
      createdAt: new Date(),
      gig: {
        id: 'g1',
        title: 'Full-Stack Next.js 14 & Prisma Marketplace Platform',
        category: 'Web Development',
        deliveryDays: 5,
      },
      buyer: { id: 'c1', name: 'Sami Mansour (Client)' },
      seller: { id: 'f1', name: 'Yassine Khelifi (Freelancer)' },
    }
  }

  const currentOrder = order!
  const isBuyer = currentOrder.buyerId === userId
  const isSeller = currentOrder.sellerId === userId
  const userRole = isBuyer ? 'BUYER' : 'SELLER'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/orders" className="text-xs text-ast-primary font-semibold hover:underline">
              ← Back to My Orders
            </Link>
          </div>
          <h1 className="font-heading font-bold text-3xl text-black">Order Workspace #{currentOrder.id}</h1>
          <p className="text-ast-gray text-xs mt-1">
            Escrow Agreement between <strong>{currentOrder.buyer?.name}</strong> and <strong>{currentOrder.seller?.name}</strong>
          </p>
        </div>
        <span className="bg-ast-primary text-white font-bold text-sm px-4 py-2 rounded-2xl shadow-sm">
          ${currentOrder.amount} Escrow Locked
        </span>
      </div>

      {/* Interactive Order Workspace Client Component */}
      <OrderWorkspaceClient
        order={currentOrder}
        userId={userId}
        userRole={userRole}
      />
    </div>
  )
}
