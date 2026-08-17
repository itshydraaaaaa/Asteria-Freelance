import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { auth }               from '@/lib/auth'
import { db }                 from '@/lib/db'
import { ProposalForm }       from '@/components/jobs/ProposalForm'
import { Clock, DollarSign, Users, Tag, Calendar, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  let job: any = null
  try {
    job = await db.job.findUnique({
      where:   { id: params.id },
      include: {
        client:    { select: { name: true } },
        _count:    { select: { proposals: true } },
      },
    })
  } catch {}

  if (!job) notFound()

  const session = await auth()
  const userId  = session?.user?.id
  const role    = (session?.user as any)?.role

  let existingProposal: any = null
  if (userId && role === 'FREELANCER') {
    try {
      existingProposal = await db.proposal.findFirst({
        where: { jobId: params.id, freelancerId: userId },
      })
    } catch {}
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-2 text-xs text-ast-gray mb-6">
          <Link href="/jobs" className="hover:text-ast-primary transition-colors">Job Board</Link>
          <span>/</span>
          <span className="text-black truncate max-w-xs">{job.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-black/8 p-8">
              <span className="inline-block text-xs font-medium text-ast-primary bg-ast-muted rounded-full px-3 py-1 mb-4">{job.category}</span>
              <h1 className="font-heading font-bold text-3xl text-black mb-4 leading-tight">{job.title}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-ast-gray mb-6">
                <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-ast-primary" /> Budget: <strong className="text-black">${job.budget.toLocaleString()}</strong></span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> Delivery: <strong className="text-black">{job.deliveryDays} days</strong></span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {job._count.proposals} proposals</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>

              <h2 className="font-semibold text-black mb-3">Project Description</h2>
              <p className="text-ast-gray leading-relaxed whitespace-pre-line">{job.description}</p>

              {job.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-black/5">
                  <h2 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <Tag size={14} /> Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s: string) => (
                      <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-3 py-1 border border-ast-primary/20 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ast-primary flex items-center justify-center text-white text-xs font-bold">
                    {job.client?.name?.[0]?.toUpperCase() ?? 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{job.client?.name ?? 'Client'}</p>
                    <p className="text-xs text-ast-gray">Posted by · Client</p>
                  </div>
                  <CheckCircle size={14} className="text-ast-primary ml-1" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-black/8 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-1">
                <span className="font-heading font-bold text-3xl text-black">${job.budget.toLocaleString()}</span>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                  job.status === 'OPEN' ? 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30' : 'bg-black/8 text-ast-gray'
                }`}>{job.status}</span>
              </div>
              <p className="text-ast-gray text-xs mb-5">Maximum budget</p>

              {!session ? (
                <Link href="/login" className="block w-full text-center bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors">
                  Sign in to Apply
                </Link>
              ) : role !== 'FREELANCER' ? (
                <p className="text-ast-gray text-sm text-center py-2">Only freelancers can submit proposals.</p>
              ) : existingProposal ? (
                <div className="text-center py-3">
                  <CheckCircle size={24} className="text-ast-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-black">Proposal Submitted</p>
                  <p className="text-xs text-ast-gray mt-1">Your offer: ${existingProposal.price} · {existingProposal.deliveryDays} days</p>
                </div>
              ) : job.status !== 'OPEN' ? (
                <p className="text-ast-gray text-sm text-center py-2">This job is no longer accepting proposals.</p>
              ) : (
                <ProposalForm jobId={job.id} budget={job.budget} deliveryDays={job.deliveryDays} />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-5">
              <h3 className="font-semibold text-black text-sm mb-3">Project Details</h3>
              <div className="space-y-2">
                {[
                  ['Category',    job.category],
                  ['Budget',      `$${job.budget.toLocaleString()}`],
                  ['Delivery',    `${job.deliveryDays} days`],
                  ['Proposals',   String(job._count.proposals)],
                  ['Status',      job.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-ast-gray">{k}</span>
                    <span className="font-medium text-black">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
