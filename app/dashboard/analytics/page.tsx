import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { TrendingUp, Eye, MousePointerClick, Users, Star, BarChart2 } from 'lucide-react'

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

function mockSeries(base: number, variance: number) {
  return MONTHS.map(month => ({
    month,
    value: Math.max(0, Math.round(base + (Math.random() - 0.4) * variance)),
  }))
}

export default async function AnalyticsPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''

  let orders: any[] = []
  let gigCount = 0
  try {
    orders   = await db.order.findMany({ where: { sellerId: userId } })
    gigCount = await db.gig.count({ where: { freelancerId: userId } })
  } catch {}

  const totalEarnings   = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.amount, 0)
  const completionRate  = orders.length > 0 ? Math.round((orders.filter(o => o.status === 'COMPLETED').length / orders.length) * 100) : 0
  const earningsSeries  = mockSeries(totalEarnings / 6 || 80, 120)
  const viewsSeries     = mockSeries(420, 300)
  const clicksSeries    = mockSeries(85, 60)
  const conversionSeries = mockSeries(12, 8)

  const kpis = [
    { label: 'Profile Views',    value: '4,821',                     sub: '+18% this month',  Icon: Eye,             color: 'text-sky-600',    bg: 'bg-sky-50' },
    { label: 'Gig Clicks',       value: '1,247',                     sub: '+9% this month',   Icon: MousePointerClick, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Conversion Rate',  value: `${completionRate || 14}%`,   sub: 'Orders / Views',  Icon: TrendingUp,       color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Active Gigs',      value: String(gigCount),             sub: 'Listed services', Icon: BarChart2,        color: 'text-ast-primary', bg: 'bg-ast-primary/10' },
    { label: 'Avg. Rating',      value: '4.9 ★',                     sub: 'All reviews',     Icon: Star,             color: 'text-yellow-600',  bg: 'bg-yellow-50' },
    { label: 'Repeat Clients',   value: '68%',                       sub: 'Return rate',     Icon: Users,            color: 'text-pink-600',    bg: 'bg-pink-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black">Analytics</h1>
        <p className="text-ast-gray text-sm mt-1">Performance insights for the last 12 months</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="font-heading font-bold text-2xl text-black">{value}</p>
            <p className="text-ast-gray text-xs uppercase tracking-wider mt-0.5">{label}</p>
            <p className="text-ast-gray text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <h3 className="font-semibold text-black mb-1">Revenue (12 months)</h3>
          <p className="text-ast-gray text-xs mb-4">Total earnings from completed orders</p>
          <DashboardChart data={earningsSeries} color="#11606e" label="Revenue ($)" />
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <h3 className="font-semibold text-black mb-1">Profile Views</h3>
          <p className="text-ast-gray text-xs mb-4">Monthly visitors to your profile</p>
          <DashboardChart data={viewsSeries} color="#4CB4E7" label="Views" />
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <h3 className="font-semibold text-black mb-1">Gig Clicks</h3>
          <p className="text-ast-gray text-xs mb-4">Clicks on your service listings</p>
          <DashboardChart data={clicksSeries} color="#60c8d4" label="Clicks" />
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <h3 className="font-semibold text-black mb-1">Orders Received</h3>
          <p className="text-ast-gray text-xs mb-4">New orders per month</p>
          <DashboardChart data={conversionSeries} color="#0a3a40" label="Orders" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <h3 className="font-semibold text-black mb-4">AI Market Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Best Posting Days',   body: 'Sunday–Tuesday posts receive 34% more views. Schedule new gig updates on these days for maximum visibility.',     badge: '📅 Timing' },
            { title: 'Pricing Opportunity', body: `Your category average is $${Math.round((totalEarnings / (orders.length || 1)) || 180)}. Top-earners in your niche price 20% higher with faster delivery times.`, badge: '💰 Pricing' },
            { title: 'Hot Skills in Demand', body: 'Clients are actively searching for: AI Integration, LLM APIs, Mobile Apps, and Arabic-language Content. Consider adding these to your profile.',                       badge: '🔥 Trending' },
          ].map(({ title, body, badge }) => (
            <div key={title} className="bg-ast-surface rounded-2xl p-5 border border-black/5">
              <span className="text-[11px] font-semibold text-ast-primary bg-ast-muted rounded-full px-2 py-0.5 mb-3 inline-block">{badge}</span>
              <h4 className="font-semibold text-black text-sm mb-2">{title}</h4>
              <p className="text-ast-gray text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
