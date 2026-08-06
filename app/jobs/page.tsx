import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { JobBrowser } from '@/components/jobs/JobBrowser'
import { categories } from '@/lib/data/categories'

export const revalidate = 30

export default async function JobsPage() {
  const supabase = createClient()
  let jobs: any[] = []

  try {
    // 1. Fetch from Supabase, pulling in the client's name and the proposal IDs
    const { data, error } = await supabase
      .from('Job')
      .select('*, client:User(name), proposals:Proposal(id)')
      .eq('status', 'OPEN')
      .order('createdAt', { ascending: false })

    if (error) throw error

    // 2. Map the data to perfectly match the shape your JobBrowser component expects
    if (data) {
      jobs = data.map((job: any) => ({
        ...job,
        // Supabase returns relations as arrays or objects depending on the foreign key, we ensure it's an object
        client: Array.isArray(job.client) ? job.client[0] : job.client,
        // Reconstruct Prisma's exact _count structure
        _count: {
          proposals: job.proposals?.length || 0
        }
      }))
    }
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
            className="shrink-0 bg-ast-primary text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-ast-dark transition-colors"
          >
            + Post a Job
          </Link>
        </div>
        <JobBrowser initialJobs={jobs} categories={categories} />
      </div>
    </div>
  )
}