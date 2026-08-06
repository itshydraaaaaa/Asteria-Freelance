'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface Props {
  data: number[]
  color?: string
  label?: string
}

export function DashboardChart({ data, color = '#11606e', label = 'Earnings' }: Props) {
  const chartData = MONTHS.map((m, i) => ({ month: m, value: data[i] ?? 0 }))
  const gradId = `grad-${color.replace('#', '')}`

  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6 h-64">
      <h3 className="font-semibold text-black mb-4">{label} — This Year</h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis     tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0a3a40', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, label]}
          />
          <Area
            type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`}
            animationDuration={1800} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
