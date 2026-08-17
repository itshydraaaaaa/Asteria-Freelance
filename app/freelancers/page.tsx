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
        <div className="mb-10">
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">Talent</p>
          <h1 className="font-heading font-bold text-5xl text-black">Elite Freelancers</h1>
          <p className="text-ast-gray mt-3 text-lg">
            {freelancers.length === 0 ? 'No freelancers have joined yet.' : `${freelancers.length} verified professionals ready to work.`}
          </p>
        </div>
        <FreelancerBrowser freelancers={freelancers} categories={categories} />
      </div>
    </div>
  )
}