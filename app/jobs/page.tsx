import { db } from '@/lib/db'
import Link from 'next/link'
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">Job Board</p>
            <h1 className="font-heading font-bold text-5xl text-black">Open Projects</h1>
            <p className="text-ast-gray mt-3 text-lg">
              {jobs.length === 0 ? 'No jobs posted yet — be the first!' : `${jobs.length} active projects seeking talent`}
            </p>
          </div>
          <Link
            href="/post-job"
            className="shrink-0 bg-ast-primary text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-ast-dark transition-colors shadow-sm"
          >
            + Post a Job
          </Link>
        </div>
        <JobBrowser initialJobs={jobs} categories={categories} />
      </div>
    </div>
  )
}