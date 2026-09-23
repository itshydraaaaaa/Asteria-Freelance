'use client'

import Link from 'next/link'
import { Briefcase, Plus, Users, Clock } from 'lucide-react'
import { ClientJobProposals } from '@/components/jobs/ClientJobProposals'
import { useLanguage } from '@/components/providers/LanguageContext'

interface Props {
  jobs: any[]
  allProposals: any[]
}

export function JobsOverviewClient({ jobs, allProposals }: Props) {
  const { t, isRTL, dir } = useLanguage()

  const totalProposalsCount = jobs.reduce((sum, j) => {
    const jobProps = allProposals.filter(p => p.jobId === j.id)
    return sum + jobProps.length
  }, 0)

  return (
    <div className={`space-y-8 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      {/* Header Banner */}
      <div className="rounded-[28px] border border-black/8 bg-gradient-to-br from-[#0a3a40] via-[#11606e] to-[#60c8d4] p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                {t('dashClientWorkspace')}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl text-white">
              {t('jobsTitle')}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
              {t('jobsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-ast-primary shadow-sm hover:bg-white/90 transition-all"
            >
              <Plus size={16} /> {t('jobsNewProject')}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm">
          <span className="text-xs text-ast-gray block uppercase font-medium">{t('dashPostedProjects')}</span>
          <span className="font-heading font-bold text-2xl text-black mt-1 block">{jobs.length}</span>
          <span className="text-[11px] text-ast-gray mt-1 block">{t('navJobs')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm">
          <span className="text-xs text-ast-gray block uppercase font-medium">{t('jobsApplications')}</span>
          <span className="font-heading font-bold text-2xl text-ast-primary mt-1 block">{totalProposalsCount}</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">{t('step2Badge')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm">
          <span className="text-xs text-ast-gray block uppercase font-medium">{t('featEscrowTitle')}</span>
          <span className="font-heading font-bold text-2xl text-emerald-700 mt-1 block">100% Escrow</span>
          <span className="text-[11px] text-ast-gray mt-1 block">{t('featLocalDesc')}</span>
        </div>
      </div>

      {/* Jobs & Applications List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/8 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-ast-surface border border-black/8 flex items-center justify-center text-ast-primary mx-auto">
            <Briefcase size={32} />
          </div>
          <h3 className="font-heading font-bold text-xl text-black">{t('jobsNoJobs')}</h3>
          <p className="text-xs text-ast-gray max-w-md mx-auto leading-relaxed">
            {t('jobsNoJobsSub')}
          </p>
          <Link
            href="/post-job"
            className="inline-flex items-center gap-2 bg-ast-primary text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-ast-dark transition-colors shadow-sm"
          >
            <Plus size={14} /> {t('jobsPostFirst')}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map(job => {
            const jobProposals = allProposals.filter(p => p.jobId === job.id)

            return (
              <div key={job.id} className="bg-white rounded-3xl border border-black/8 overflow-hidden shadow-sm space-y-4 p-6 md:p-8">
                {/* Job Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-ast-primary bg-ast-muted rounded-full px-3 py-1">
                        {job.category}
                      </span>
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                        job.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-black/8 text-ast-gray'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    <h2 className="font-heading font-bold text-xl text-black">
                      <Link href={`/jobs/${job.id}`} className="hover:text-ast-primary transition-colors">
                        {job.title}
                      </Link>
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ast-gray mt-2">
                      <span className="font-bold text-emerald-700">Budget: {job.budget} TND</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> {job.deliveryDays} {t('deliveryDays')}</span>
                      <span className="flex items-center gap-1 font-semibold text-ast-primary">
                        <Users size={13} /> {jobProposals.length} {t('jobsApplications')}
                      </span>
                      <span>· {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-4 py-2 bg-ast-surface border border-black/10 rounded-xl text-xs font-bold text-black hover:bg-black hover:text-white transition-colors"
                    >
                      {t('gigsPreview')} →
                    </Link>
                  </div>
                </div>

                {/* Job Description Preview */}
                <p className="text-xs text-ast-gray leading-relaxed whitespace-pre-line line-clamp-2">
                  {job.description}
                </p>

                {/* Applications Browser */}
                <div className="pt-2">
                  <ClientJobProposals
                    job={job}
                    initialProposals={jobProposals}
                    isJobOwner={true}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
