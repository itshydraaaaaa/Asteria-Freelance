import { db } from '@/lib/db'
import { FreelancerBrowser } from '@/components/freelancers/FreelancerBrowser'
import { categories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export default async function FreelancersPage() {
  let freelancers: any[] = []

  try {
    const dbFreelancers = await db.user.findMany({ where: { role: 'FREELANCER' } })
    freelancers = dbFreelancers ?? []
  } catch (error) {
    console.error("Failed to fetch freelancers:", error)
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <FreelancerBrowser freelancers={freelancers} categories={categories} />
      </div>
    </div>
  )
}