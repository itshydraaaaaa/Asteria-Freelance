'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { stagger, fadeUp } from '@/lib/motion'

interface Metric { label: string; value: string; sub: string }

function CountUp({ target, prefix, suffix }: { target: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    let start = 0
    const end = target
    const duration = 1800
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * end)
      if (ref.current) ref.current.textContent = `${prefix ?? ''}${current.toLocaleString()}${suffix ?? ''}`
      if (progress < 1) requestAnimationFrame(ts => step(ts, startTime))
    }
    requestAnimationFrame(ts => step(ts, ts))
  }, [target, prefix, suffix])
  return <span ref={ref}>{prefix}{0}{suffix}</span>
}

export function DashboardStats({ metrics }: { metrics: Metric[] }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          className="bg-white rounded-2xl border border-black/8 p-6 border-l-[3px] border-l-ast-primary"
        >
          <p className="text-ast-gray text-xs uppercase tracking-wider mb-2">{m.label}</p>
          <p className="font-heading font-bold text-2xl text-black">{m.value}</p>
          <p className="text-ast-gray text-xs mt-1">{m.sub}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
