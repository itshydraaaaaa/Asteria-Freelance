'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { categories } from '@/lib/data/categories'
import { scaleIn, stagger, microHover } from '@/lib/motion'
import { Star, Clock } from 'lucide-react'

const FILTERS = ['All', ...categories.map(c => c.name).slice(0, 5)]

export function FeaturedGigsSection() {
  const [active, setActive] = useState('All')
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGigs = async () => {
      try {
        const res = await fetch('/api/gigs', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setGigs(data.gigs || [])
        }
      } catch {}
      finally {
        setLoading(false)
      }
    }
    loadGigs()
  }, [])

  const filtered = active === 'All'
    ? gigs.slice(0, 6)
    : gigs.filter(g => g.category?.toLowerCase() === active.toLowerCase()).slice(0, 6)

  return (
    <section className="bg-ast-surface py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
          <div>
            <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">Services</p>
            <h2 className="font-heading font-bold text-4xl lg:text-5xl text-black">Featured Gigs</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`text-sm rounded-full px-4 py-1.5 transition-all ${
                  active === f
                    ? 'bg-ast-primary text-white'
                    : 'border border-black/15 text-ast-gray hover:border-ast-primary hover:text-ast-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-64 bg-black/5 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-ast-gray"
            >
              No gigs found in this category yet.
            </motion.div>
          ) : (
            <motion.div
              key={active}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map(gig => (
                <motion.div key={gig.id} variants={scaleIn}>
                  <Link
                    href={`/gig/${gig.id}`}
                    className="group block bg-white rounded-2xl overflow-hidden border border-black/8 hover:border-ast-light/60 hover:shadow-lg transition-all"
                  >
                    <motion.div variants={microHover} initial="rest" whileHover="hover" whileTap={{ scale: 0.995 }}>
                      <div className="h-40 bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center overflow-hidden">
                        {gig.image ? (
                          <img src={gig.image} alt={gig.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="font-mono text-ast-light/30 text-xs tracking-widest uppercase">{gig.category}</span>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="inline-block text-xs font-medium text-ast-primary bg-ast-muted rounded-full px-2.5 py-0.5 mb-3">
                          {gig.category}
                        </span>
                        <h3 className="font-heading font-semibold text-black text-base leading-snug mb-3 group-hover:text-ast-primary transition-colors line-clamp-2">
                          {gig.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-ast-gray">
                          <span className="flex items-center gap-1">
                            <Star size={13} className="text-yellow-400 fill-yellow-400" />
                            {Number(gig.rating ?? 5.0).toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {gig.deliveryDays}d
                          </span>
                          <span className="font-semibold text-black">{Number(gig.price).toFixed(2)} TND</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-12">
          <Link href="/explore" className="inline-block border border-ast-primary text-ast-primary rounded-full px-8 py-3 hover:bg-ast-primary hover:text-white transition-colors font-medium">
            View All Gigs
          </Link>
        </div>
      </div>
    </section>
  )
}
