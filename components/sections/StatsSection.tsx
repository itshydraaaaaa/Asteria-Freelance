'use client'
import { motion } from 'framer-motion'
import { fadeUp, stagger } from '@/lib/motion'

const STATS = [
  { value: '12,400+', label: 'Active Freelancers' },
  { value: '98%',     label: 'Client Satisfaction' },
  { value: '$2.4M+',  label: 'Total Paid Out' },
  { value: '48h',     label: 'Avg Delivery Time' },
]

export function StatsSection() {
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
          {STATS.map((s, i) => (
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
