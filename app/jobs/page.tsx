import { db } from '@/lib/db'
import { JobBrowser } from '@/components/jobs/JobBrowser'
import { categories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  let jobs: any[] = []

  try {
    const dbJobs = await db.job.findMany()
    jobs = dbJobs ?? []
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <JobBrowser initialJobs={jobs} categories={categories} />
      </div>
    </div>
  )
}