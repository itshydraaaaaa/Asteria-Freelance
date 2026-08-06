import { createClient } from '@/lib/supabase/server'
import { GigBrowser } from '@/components/explore/GigBrowser'
import { categories } from '@/lib/data/categories'

export const revalidate = 60

export default async function ExplorePage() {
  const supabase = createClient()
  let gigs: any[] = []

  try {
    // Fetch gigs and join the freelancer's details!
    const { data, error } = await supabase
      .from('Gig')
      .select('*, freelancer:User(name, image, location)')
      .order('createdAt', { ascending: false })

    if (error) throw error

    if (data) {
      gigs = data.map((gig: any) => ({
        ...gig,
        // Ensure relations are objects, not arrays
        freelancer: Array.isArray(gig.freelancer) ? gig.freelancer[0] : gig.freelancer
      }))
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