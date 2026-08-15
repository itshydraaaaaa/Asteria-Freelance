import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Star, Clock, Pencil, Eye } from 'lucide-react'

export default async function DashboardGigsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let gigs: any[] = []
  try {
    // 1. Check in unified db helper first
    gigs = await db.gig.findMany({ where: { freelancerId: userId } })

    // 2. If empty, check Supabase
    if (gigs.length === 0) {
      const supabase = createClient()
      const { data } = await supabase
        .from('Gig')
        .select('*, orders:Order(*)')
        .eq('freelancerId', userId)
        .order('createdAt', { ascending: false })

      if (data && data.length > 0) gigs = data
    }
  } catch (error) {
    console.error("Failed to fetch gigs:", error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">My Gigs</h1>
          <p className="text-ast-gray text-sm mt-1">{gigs.length} service{gigs.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link
          href="/dashboard/gigs/new"
          className="flex items-center gap-2 bg-ast-primary text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-ast-dark transition-colors"
        >
          <Plus size={15} /> New Gig
        </Link>
      </div>

      {gigs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/8 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-ast-primary/10 flex items-center justify-center mx-auto mb-5">
            <Star size={28} className="text-ast-primary" />
          </div>
          <h3 className="font-heading font-bold text-xl text-black mb-2">No gigs yet</h3>
          <p className="text-ast-gray text-sm mb-6 max-w-sm mx-auto">
            Create your first service listing and start getting discovered by clients across the MENA region.
          </p>
          <Link
            href="/dashboard/gigs/new"
            className="inline-flex items-center gap-2 bg-ast-primary text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-ast-dark transition-colors"
          >
            <Plus size={15} /> Create Your First Gig
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {gigs.map((gig: any) => {
            const orders       = gig.orders ?? []
            const earnings     = orders.filter((o: any) => o.status === 'COMPLETED').reduce((s: number, o: any) => s + o.amount, 0)
            const activeOrders = orders.filter((o: any) => o.status === 'ACTIVE').length

            return (
              <div key={gig.id} className="bg-white rounded-2xl border border-black/8 overflow-hidden group hover:shadow-md transition-all">
                <div className="h-32 bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center p-4">
                  <span className="font-mono text-ast-light/60 text-xs tracking-widest uppercase font-bold text-center">{gig.category}</span>
                </div>

                <div className="p-5">
                  <span className="inline-block text-[11px] font-medium text-ast-primary bg-ast-muted rounded-full px-2 py-0.5 mb-2">{gig.category}</span>
                  <h3 className="font-semibold text-black text-sm leading-snug mb-3 line-clamp-2">{gig.title}</h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-ast-surface rounded-xl p-3 text-center">
                      <p className="font-bold text-black text-base">${earnings.toLocaleString()}</p>
                      <p className="text-ast-gray text-[10px] mt-0.5">Earnings</p>
                    </div>
                    <div className="bg-ast-surface rounded-xl p-3 text-center">
                      <p className="font-bold text-black text-base">{activeOrders}</p>
                      <p className="text-ast-gray text-[10px] mt-0.5">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ast-gray pt-3 border-t border-black/5">
                    <span className="flex items-center gap-1"><Clock size={11} /> {gig.deliveryDays}d delivery</span>
                    <span className="font-semibold text-black">From ${gig.price}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/gig/${gig.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-black/15 text-black rounded-xl py-2 text-xs font-medium hover:bg-ast-surface transition-colors"
                    >
                      <Eye size={12} /> Preview
                    </Link>
                    <Link
                      href={`/dashboard/gigs/${gig.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-ast-primary text-white rounded-xl py-2 text-xs font-medium hover:bg-ast-dark transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}