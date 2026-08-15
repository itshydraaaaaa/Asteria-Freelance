import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { GigBrowser } from '@/components/explore/GigBrowser'
import { categories } from '@/lib/data/categories'

export const revalidate = 60

export default async function ExplorePage() {
  let gigs: any[] = []

  try {
    // 1. Try DB helper
    const dbGigs = await db.gig.findMany()
    if (dbGigs && dbGigs.length > 0) {
      gigs = dbGigs
    } else {
      // 2. Fall back to Supabase
      const supabase = createClient()
      const { data } = await supabase
        .from('Gig')
        .select('*, freelancer:User(name, image, location)')
        .order('createdAt', { ascending: false })
      if (data) {
        gigs = data.map((gig: any) => ({
          ...gig,
          freelancer: Array.isArray(gig.freelancer) ? gig.freelancer[0] : gig.freelancer
        }))
      }
    }
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