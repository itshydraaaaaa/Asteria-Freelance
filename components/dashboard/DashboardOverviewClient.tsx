'use client'

import Link from 'next/link'
import { Briefcase, Star, Plus, ArrowRight } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { useLanguage } from '@/components/providers/LanguageContext'

interface Props {
  name: string
  role: string
  earnings: number
  activeOrders: number
  completedOrders: number
  completionRate: number
  gigsCount: number
  jobsCount: number
  monthlyChartData: { month: string; value: number }[]
  monthlyVolumeData: { month: string; value: number }[]
  jobs: any[]
  myProposals: any[]
  orders: any[]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  ACTIVE:    'bg-ast-primary text-white',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
}

export function DashboardOverviewClient({
  name,
  role,
  earnings,
  activeOrders,
  completedOrders,
  completionRate,
  gigsCount,
  jobsCount,
  monthlyChartData,
  monthlyVolumeData,
  jobs,
  myProposals,
  orders,
}: Props) {
  const { t, isRTL, dir } = useLanguage()

  const metrics = role === 'FREELANCER' ? [
    { label: t('dashTotalEarnings'),   value: `${earnings.toLocaleString()} TND`, sub: t('featEscrowTitle') },
    { label: t('dashActiveOrders'),    value: String(activeOrders),            sub: t('ordersColStatus') },
    { label: t('dashCompletionRate'),  value: `${completionRate}%`,            sub: t('stepLabel') },
    { label: t('dashPublishedGigs'),   value: String(gigsCount),               sub: t('catLiveServices') },
  ] : [
    { label: t('dashTotalEscrowSpent'), value: `${earnings.toLocaleString()} TND`, sub: t('featEscrowTitle') },
    { label: t('dashActiveContracts'), value: String(activeOrders),            sub: t('ordersColStatus') },
    { label: t('dashCompletedJobs'),   value: String(completedOrders),         sub: t('step3Title') },
    { label: t('dashPostedProjects'),  value: String(jobsCount),               sub: t('navJobs') },
  ]

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      {/* Role-Specific Header Banner */}
      <div className="rounded-[28px] border border-black/8 bg-gradient-to-br from-[#0a3a40] via-[#11606e] to-[#60c8d4] p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.35em] bg-white/15 px-3 py-1 rounded-full text-white/90">
                {role === 'FREELANCER' ? t('dashFreelancerWorkspace') : t('dashClientWorkspace')}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-white">
              {t('dashWelcome')}, {name}!
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 leading-relaxed">
              {role === 'FREELANCER' 
                ? t('dashFreelancerSubtitle')
                : t('dashClientSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {role === 'FREELANCER' ? (
              <>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 bg-white text-ast-dark px-5 py-2.5 rounded-full text-xs font-bold hover:bg-ast-surface transition-colors shadow-sm"
                >
                  <Briefcase size={14} /> {t('dashBrowseOpenJobs')}
                </Link>
                <Link
                  href="/dashboard/gigs/new"
                  className="flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Plus size={14} /> {t('dashPostNewGig')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="flex items-center gap-2 bg-white text-ast-dark px-5 py-2.5 rounded-full text-xs font-bold hover:bg-ast-surface transition-colors shadow-sm"
                >
                  <Star size={14} /> {t('dashExploreFreelancerGigs')}
                </Link>
                <Link
                  href="/post-job"
                  className="flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Plus size={14} /> {t('dashPostProjectBrief')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <DashboardStats metrics={metrics} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">
            {role === 'FREELANCER' ? t('dashMonthlyRevenue') : t('dashMonthlyEscrowSpend')}
          </h3>
          <p className="text-ast-gray text-xs mb-4">{t('analyticsRevenueFlow')}</p>
          <DashboardChart data={monthlyChartData} color="#11606e" label="Revenue (TND)" />
        </div>

        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">{t('analyticsContractsVolume')}</h3>
          <p className="text-ast-gray text-xs mb-4">{t('analyticsContractsDesc')}</p>
          <DashboardChart data={monthlyVolumeData} color="#4CB4E7" label="Orders" />
        </div>
      </div>

      {/* Client Posted Jobs Section */}
      {(jobs.length > 0 || role === 'CLIENT' || role === 'ADMIN') && (
        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-black text-lg">{t('jobsTitle')}</h3>
              <p className="text-ast-gray text-xs">{t('jobsSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/jobs" className="border border-black/15 text-black text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ast-surface transition-colors flex items-center gap-1.5 shadow-2xs">
                {t('dashViewAll')} →
              </Link>
              <Link href="/post-job" className="bg-ast-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ast-dark transition-colors flex items-center gap-1.5 shadow-xs">
                <Plus size={14} /> {t('jobsNewProject')}
              </Link>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="py-8 text-center space-y-3 bg-ast-surface/40 rounded-2xl border border-black/5">
              <p className="text-ast-gray text-xs">{t('jobsNoJobs')}</p>
              <Link href="/post-job" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                {t('jobsPostFirst')}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                    <th className="px-4 py-3 font-medium">{t('dashColService')}</th>
                    <th className="px-4 py-3 font-medium">{t('filterCategories')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashColAmount')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashColStatus')}</th>
                    <th className="px-4 py-3 font-medium">{t('jobsApplications')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('ordersColActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {jobs.map(j => (
                    <tr key={j.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-4 py-4 font-semibold text-black">
                        <Link href={`/jobs/${j.id}`} className="hover:text-ast-primary transition-colors">
                          {j.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-xs text-ast-gray">{j.category}</td>
                      <td className="px-4 py-4 text-black font-bold">{j.budget} TND</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-[11px] rounded-full px-2.5 py-0.5 font-bold ${
                          j.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/8 text-ast-gray'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-ast-primary">
                        {j._count?.proposals ?? 0} {t('jobsApplications')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/jobs/${j.id}`}
                          className="px-3.5 py-1.5 bg-ast-surface border border-black/10 rounded-xl text-xs font-bold text-ast-primary hover:bg-ast-primary hover:text-white transition-colors inline-block"
                        >
                          {t('jobsApplications')} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Freelancer Submitted Proposals Section */}
      {myProposals.length > 0 && (
        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-black text-lg">{t('jobsApplications')}</h3>
              <p className="text-ast-gray text-xs">{t('ordersSubtitle')}</p>
            </div>
            <Link href="/jobs" className="text-xs font-semibold text-ast-primary flex items-center gap-1 hover:underline">
              {t('dashBrowseOpenJobs')} <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">{t('dashColOrderId')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColAmount')}</th>
                  <th className="px-4 py-3 font-medium">{t('gigsDeliveryDays')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColDate')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('ordersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {myProposals.map(p => (
                  <tr key={p.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-4 py-4 font-semibold text-black">
                      <Link href={`/jobs/${p.jobId}`} className="hover:text-ast-primary transition-colors">
                        Project #{p.jobId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-black font-bold">{p.price} TND</td>
                    <td className="px-4 py-4 text-xs text-ast-gray">{p.deliveryDays} {t('deliveryDays')}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-[11px] rounded-full px-2.5 py-0.5 font-bold ${
                        p.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'REJECTED'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ast-gray text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/jobs/${p.jobId}`}
                        className="text-xs font-bold text-ast-primary hover:underline"
                      >
                        {t('gigsPreview')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-black text-lg">
            {role === 'FREELANCER' ? t('dashRecentContracts') : t('ordersTitle')}
          </h3>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-ast-primary flex items-center gap-1 hover:underline">
            {t('dashViewAll')} <ArrowRight size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-ast-gray text-xs">{t('dashNoContracts')}</p>
            <p className="text-ast-gray text-xs">{t('dashNoContractsSub')}</p>
            {role === 'FREELANCER' ? (
              <Link href="/jobs" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                {t('dashBrowseOpenJobs')}
              </Link>
            ) : (
              <Link href="/explore" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                {t('dashExploreFreelancerGigs')}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">{t('dashColService')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColAmount')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashColDate')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('ordersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-4 py-4 font-medium text-black">
                      <Link href={`/dashboard/orders/${o.id}`} className="hover:text-ast-primary transition-colors">
                        {o.gig?.title ?? `Order #${o.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-black font-bold">{o.amount} TND</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-bold ${STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="text-xs font-bold text-ast-primary hover:underline"
                      >
                        {t('ordersWorkspace')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
