'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { categories } from '@/lib/data/categories'
import { stagger, fadeUp } from '@/lib/motion'
import { ArrowRight } from 'lucide-react'

const COLOR_MAP: Record<string, string> = {
  'ast-primary': 'bg-ast-primary/10 text-ast-primary border-ast-primary/20',
  'ast-light':   'bg-ast-light/10 text-ast-primary border-ast-light/30',
  'ast-sky':     'bg-ast-sky/10 text-ast-primary border-ast-sky/30',
  'black':       'bg-black/5 text-black border-black/10',
}

interface Props {
  categoryCounts?: Record<string, number>
}

export function CategoriesSection({ categoryCounts = {} }: Props) {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">Browse by</p>
          <h2 className="font-heading font-bold text-4xl text-black">Popular Categories</h2>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {categories.map((cat, i) => {
            const count = categoryCounts[cat.name] ?? categoryCounts[cat.slug] ?? 0

            return (
              <motion.div key={i} variants={fadeUp}>
                <Link
                  href={`/explore?category=${encodeURIComponent(cat.name)}`}
                  className={`group block rounded-2xl border p-6 hover:shadow-md transition-all ${COLOR_MAP[cat.color] ?? COLOR_MAP['black']}`}
                >
                  <p className="font-heading font-semibold text-lg mb-1 group-hover:underline">{cat.name}</p>
                  <div className="text-sm opacity-70 flex items-center justify-between">
                    {count > 0 ? (
                      <span>{count} live service{count !== 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-xs">Explore category</span>
                    )}
                    <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-ast-primary" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

