'use client'
import { motion } from 'framer-motion'
import { fadeUp, stagger } from '@/lib/motion'

import { useState, useEffect } from 'react'

export function StatsSection() {
  const [stats, setStats] = useState({
    freelancerCount: 12,
    clientSatisfaction: 99,
    totalPaidOut: 2400,
    avgDeliveryHours: 48,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({
            freelancerCount: data.freelancerCount || 12,
            clientSatisfaction: Math.round(data.successRate) || 99,
            totalPaidOut: data.totalPaidOut || 2400,
            avgDeliveryHours: data.avgDeliveryHours || 48,
          })
        }
      } catch {}
    }
    fetchStats()
  }, [])

  const formatPayout = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M TND`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K TND`
    return `${val} TND`
  }

  const items = [
    { value: `${stats.freelancerCount}+`, label: 'Active Freelancers' },
    { value: `${stats.clientSatisfaction}%`, label: 'Client Satisfaction' },
    { value: formatPayout(stats.totalPaidOut), label: 'Total Paid Out' },
    { value: `${Math.round(stats.avgDeliveryHours)}h`, label: 'Avg Delivery Time' },
  ]

  return (
    <section className="bg-ast-dark py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {items.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <p className="font-heading font-bold text-4xl lg:text-5xl text-ast-light mb-2">{s.value}</p>
              <p className="text-white/50 text-sm tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
