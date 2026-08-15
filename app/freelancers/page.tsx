import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { FreelancerBrowser } from '@/components/freelancers/FreelancerBrowser'
import { categories } from '@/lib/data/categories'

export const revalidate = 60

export default async function FreelancersPage() {
  let freelancers: any[] = []

  try {
    // 1. Try DB helper
    const dbFreelancers = await db.user.findMany({ where: { role: 'FREELANCER' } })
    if (dbFreelancers && dbFreelancers.length > 0) {
      freelancers = dbFreelancers
    } else {
      // 2. Fall back to Supabase
      const supabase = createClient()
      const { data } = await supabase
        .from('User')
        .select('*')
        .eq('role', 'FREELANCER')
        .order('createdAt', { ascending: false })
      if (data) freelancers = data
    }
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