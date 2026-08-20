import { notFound } from 'next/navigation'
import Link         from 'next/link'
import { auth }     from '@/lib/auth'
import { db }       from '@/lib/db'
import { ProposalForm } from '@/components/jobs/ProposalForm'
import { Clock, Users, Tag, Calendar, CheckCircle, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  let job: any = null
  try {
    job = await db.job.findUnique({
      where: { id: params.id },
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

  const clientName = job.client?.name ?? 'Verified Client'
  const clientId = job.clientId ?? job.client?.id

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
            <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-6 shadow-sm">
              <div>
                <span className="inline-block text-xs font-semibold text-ast-primary bg-ast-muted rounded-full px-3 py-1 mb-3">
                  {job.category}
                </span>
                <h1 className="font-heading font-bold text-3xl text-black mb-4 leading-tight">{job.title}</h1>

                <div className="flex flex-wrap gap-4 text-xs text-ast-gray">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                    Budget: {job.budget} TND
                  </span>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> Delivery: <strong className="text-black">{job.deliveryDays} days</strong></span>
                  <span className="flex items-center gap-1.5"><Users size={13} /> {job._count?.proposals ?? 0} proposals</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-black/5 pt-6">
                <h2 className="font-heading font-bold text-black text-lg mb-3">Project Description</h2>
                <p className="text-ast-gray text-xs leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="border-t border-black/5 pt-6">
                  <h2 className="font-semibold text-black text-xs mb-3 flex items-center gap-2">
                    <Tag size={13} /> Required Skills & Tech Stack
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s: string) => (
                      <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-3 py-1 border border-ast-primary/20 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-black/5 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-ast-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {clientName[0]?.toUpperCase() ?? 'C'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">{clientName}</p>
                    <p className="text-[10px] text-ast-gray">Job Poster · Verified Client</p>
                  </div>
                </div>

                {clientId && (
                  <Link
                    href={`/dashboard/messages?user=${clientId}`}
                    className="px-4 py-2 bg-ast-surface border border-black/10 rounded-xl text-xs font-semibold text-ast-primary hover:bg-ast-primary hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>Message Client</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-black/8 p-6 sticky top-24 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-3xl text-ast-primary">{job.budget} TND</span>
                  <p className="text-ast-gray text-[10px]">Maximum Escrow Budget</p>
                </div>
                <span className={`text-[10px] font-bold rounded-full px-3 py-1 ${
                  job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/8 text-ast-gray'
                }`}>{job.status}</span>
              </div>

              {!session ? (
                <Link href="/login" className="block w-full text-center bg-ast-primary text-white rounded-2xl py-3 font-bold text-xs hover:bg-ast-dark transition-colors shadow-sm">
                  Sign in to Submit Proposal
                </Link>
              ) : role !== 'FREELANCER' ? (
                <div className="p-3.5 bg-ast-surface rounded-2xl text-center text-xs text-ast-gray">
                  You are logged in as a Client. Only Freelancers can submit bids.
                </div>
              ) : existingProposal ? (
                <div className="text-center py-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <CheckCircle size={24} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-900">Proposal Submitted</p>
                  <p className="text-[11px] text-emerald-700 mt-1">Your bid: {existingProposal.price} TND · {existingProposal.deliveryDays} days</p>
                </div>
              ) : job.status !== 'OPEN' ? (
                <p className="text-ast-gray text-xs text-center py-2">This job is no longer accepting proposals.</p>
              ) : (
                <ProposalForm jobId={job.id} budget={job.budget} deliveryDays={job.deliveryDays} />
              )}

              <div className="pt-3 border-t border-black/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ast-gray">Category</span>
                  <span className="font-semibold text-black">{job.category}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ast-gray">Target Delivery</span>
                  <span className="font-semibold text-black">{job.deliveryDays} days</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ast-gray">Total Proposals</span>
                  <span className="font-semibold text-black">{job._count?.proposals ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ast-gray">Payment Security</span>
                  <span className="font-semibold text-emerald-700">100% Asteria Escrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
