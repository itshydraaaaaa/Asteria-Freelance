import { db } from '@/lib/db'
import { GigBrowser } from '@/components/explore/GigBrowser'
import { categories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  let gigs: any[] = []

  try {
    const dbGigs = await db.gig.findMany()
    gigs = dbGigs ?? []
  } catch (error) {
    console.error("Failed to fetch gigs:", error)
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="mb-10">
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">Marketplace</p>
          <h1 className="font-heading font-bold text-5xl text-black">Explore Services</h1>
          <p className="text-ast-gray mt-3 text-lg">
            {gigs.length === 0 ? 'No services listed yet.' : `Browse ${gigs.length} services from elite MENA freelancers.`}
          </p>
        </div>
        <GigBrowser initialGigs={gigs} categories={categories} />
      </div>
    </div>
  )
}