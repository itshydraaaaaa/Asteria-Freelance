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
        <GigBrowser initialGigs={gigs} categories={categories} />
      </div>
    </div>
  )
}