'use client'

import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { TrendingUp, Users, Star, BarChart2, DollarSign, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageContext'

interface Props {
  role: string
  totalEarnings: number
  completedOrdersCount: number
  totalOrdersCount: number
  completionRate: number
  gigsCount: number
  avgRating: string
  reviewsCount: number
  repeatClientsPct: number
  jobsCount: number
  activeOrdersCount: number
  uniqueClientsCount: number
  earningsSeries: { month: string; value: number }[]
  ordersSeries: { month: string; value: number }[]
}

export function AnalyticsOverviewClient({
  role,
  totalEarnings,
  completedOrdersCount,
  totalOrdersCount,
  completionRate,
  gigsCount,
  avgRating,
  reviewsCount,
  repeatClientsPct,
  jobsCount,
  activeOrdersCount,
  uniqueClientsCount,
  earningsSeries,
  ordersSeries,
}: Props) {
  const { t, isRTL, dir } = useLanguage()

  const kpis = role === 'FREELANCER' ? [
    {
      label: t('analyticsTotalRevenue'),
      value: `${totalEarnings.toLocaleString()} TND`,
      sub: t('featEscrowTitle'),
      Icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('analyticsCompletedOrders'),
      value: String(completedOrdersCount),
      sub: `${totalOrdersCount} ${t('ordersTitle')}`,
      Icon: CheckCircle,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: t('analyticsFulfillmentRate'),
      value: `${completionRate}%`,
      sub: t('stepLabel'),
      Icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('analyticsActiveGigs'),
      value: String(gigsCount),
      sub: t('catLiveServices'),
      Icon: BarChart2,
      color: 'text-ast-primary',
      bg: 'bg-ast-primary/10',
    },
    {
      label: t('analyticsClientRating'),
      value: `${avgRating} ★`,
      sub: `${reviewsCount} ${t('kycStatusApprovedTitle')}`,
      Icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: t('analyticsRepeatClients'),
      value: `${repeatClientsPct}%`,
      sub: t('footerCompany'),
      Icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ] : [
    {
      label: t('analyticsEscrowSpent'),
      value: `${totalEarnings.toLocaleString()} TND`,
      sub: t('featEscrowTitle'),
      Icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('analyticsCompletedOrders'),
      value: String(completedOrdersCount),
      sub: `${totalOrdersCount} ${t('ordersTitle')}`,
      Icon: CheckCircle,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: t('analyticsSuccessRate'),
      value: `${completionRate}%`,
      sub: t('stepLabel'),
      Icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('analyticsPostedProjects'),
      value: String(jobsCount),
      sub: t('navJobs'),
      Icon: BarChart2,
      color: 'text-ast-primary',
      bg: 'bg-ast-primary/10',
    },
    {
      label: t('analyticsActiveContracts'),
      value: String(activeOrdersCount),
      sub: t('ordersColStatus'),
      Icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: t('analyticsUniqueSellers'),
      value: String(uniqueClientsCount),
      sub: t('freelancersHeaderTag'),
      Icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ]

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black">{t('analyticsTitle')}</h1>
        <p className="text-ast-gray text-xs mt-1">{t('analyticsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-3xl border border-black/8 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="font-heading font-bold text-2xl text-black">{value}</p>
            <p className="text-ast-gray text-xs uppercase tracking-wider mt-0.5 font-semibold">{label}</p>
            <p className="text-ast-gray text-[11px] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">
            {role === 'FREELANCER' ? t('dashMonthlyRevenue') : t('dashMonthlyEscrowSpend')}
          </h3>
          <p className="text-ast-gray text-xs mb-4">{t('analyticsRevenueFlow')}</p>
          <DashboardChart data={earningsSeries} color="#11606e" label="TND" />
        </div>

        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">{t('analyticsContractsVolume')}</h3>
          <p className="text-ast-gray text-xs mb-4">{t('analyticsContractsDesc')}</p>
          <DashboardChart data={ordersSeries} color="#4CB4E7" label="Contracts" />
        </div>
      </div>
    </div>
  )
}
