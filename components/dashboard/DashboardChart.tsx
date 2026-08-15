'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface ChartDataItem {
  month: string
  value: number
}

interface Props {
  data: (number | ChartDataItem)[]
  color?: string
  label?: string
}

export function DashboardChart({ data, color = '#11606e', label = 'Earnings' }: Props) {
  const chartData = MONTHS.map((m, i) => {
    const item = data[i]
    if (typeof item === 'number') {
      return { month: m, value: item }
    }
    if (item && typeof item === 'object' && 'value' in item) {
      return { month: item.month ?? m, value: item.value }
    }
    return { month: m, value: 0 }
  })

  const gradId = `grad-${color.replace('#', '')}`

  return (
    <div className="h-64 rounded-3xl border border-black/8 bg-white p-6 shadow-sm card-hover">
      <h3 className="font-semibold text-black mb-4">{label} — This Year</h3>
      <div className="w-full h-full">
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
            formatter={(value: any) => [`$${Number(value ?? 0).toLocaleString()}`, label]}
          />
          <Area
            type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`}
            animationDuration={1400} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}

