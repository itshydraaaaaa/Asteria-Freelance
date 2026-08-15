'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { stagger, fadeUp, microHover, popIn } from '@/lib/motion'

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
      className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          whileHover="hover"
          initial="rest"
          animate="rest"
          whileTap={{ scale: 0.995 }}
          className="rounded-3xl border border-black/8 bg-white p-6 border-l-[3px] border-l-ast-primary shadow-sm"
        >
          <motion.div variants={microHover} className="transition-transform">
            <p className="text-ast-gray text-xs uppercase tracking-wider mb-2">{m.label}</p>
            <p className="font-heading font-bold text-2xl text-black text-anim-count"><CountUp target={Number(m.value.replace(/[^0-9]/g, '')) || 0} /></p>
            <p className="text-ast-gray text-xs mt-1">{m.sub}</p>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
