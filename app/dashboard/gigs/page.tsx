import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Star, Clock, Pencil, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardGigsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let gigs: any[] = []
  try {
    gigs = await db.gig.findMany({ where: { freelancerId: userId } })
  } catch (error) {
    console.error("Failed to fetch gigs:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">My Gigs</h1>
          <p className="text-ast-gray text-xs mt-1">{gigs.length} active service{gigs.length !== 1 ? 's' : ''} listed in marketplace</p>
        </div>
        <Link
          href="/dashboard/gigs/new"
          className="flex items-center gap-2 bg-ast-primary text-white rounded-2xl px-5 py-2.5 text-xs font-semibold hover:bg-ast-dark transition-colors shadow-sm"
        >
          <Plus size={14} /> New Gig
        </Link>
      </div>

      {gigs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/8 p-16 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-ast-primary/10 flex items-center justify-center mx-auto">
            <Star size={28} className="text-ast-primary" />
          </div>
          <h3 className="font-heading font-bold text-xl text-black">No gigs published yet</h3>
          <p className="text-ast-gray text-xs max-w-sm mx-auto">
            Create your service listings and start receiving orders from clients across Tunisia and MENA.
          </p>
          <Link
            href="/dashboard/gigs/new"
            className="inline-flex items-center gap-2 bg-ast-primary text-white rounded-2xl px-6 py-3 text-xs font-bold hover:bg-ast-dark transition-colors shadow-sm"
          >
            <Plus size={14} /> Create Your First Gig
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {gigs.map((gig: any) => {
            return (
              <div key={gig.id} className="bg-white rounded-3xl border border-black/8 overflow-hidden group hover:shadow-md transition-all">
                <div className="h-40 bg-ast-surface overflow-hidden relative">
                  {gig.image ? (
                    <img src={gig.image} alt={gig.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center">
                      <span className="font-mono text-white/80 text-xs tracking-widest uppercase font-bold">{gig.category}</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {gig.category}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-black text-sm leading-snug line-clamp-2">{gig.title}</h3>

                  <div className="flex items-center justify-between text-xs text-ast-gray pt-2 border-t border-black/5">
                    <span className="flex items-center gap-1"><Clock size={12} /> {gig.deliveryDays}d delivery</span>
                    <span className="font-bold text-ast-primary text-sm">{gig.price} TND</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/gig/${gig.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-black/15 text-black rounded-xl py-2 text-xs font-semibold hover:bg-ast-surface transition-colors"
                    >
                      <Eye size={12} /> Preview
                    </Link>
                    <Link
                      href={`/dashboard/gigs/${gig.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-ast-primary text-white rounded-xl py-2 text-xs font-semibold hover:bg-ast-dark transition-colors shadow-2xs"
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