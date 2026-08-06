'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Clock, SlidersHorizontal } from 'lucide-react'
import type { Gig } from '@/lib/data/gigs'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'

const SORT_OPTIONS = ['Relevance', 'Price: Low', 'Price: High', 'Delivery Time']

export function GigBrowser({ initialGigs, categories }: { initialGigs: Gig[]; categories: Category[] }) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Relevance')

  const filtered = useMemo(() => {
    let g = [...initialGigs]
    if (category !== 'All Categories') g = g.filter(x => x.category === category)
    if (query) g = g.filter(x => x.title.toLowerCase().includes(query.toLowerCase()) || x.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    if (sort === 'Price: Low')     g.sort((a, b) => a.price - b.price)
    if (sort === 'Price: High')    g.sort((a, b) => b.price - a.price)
    if (sort === 'Delivery Time')  g.sort((a, b) => a.deliveryDays - b.deliveryDays)
    return g
  }, [initialGigs, category, query, sort])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-black/8 p-5 sticky top-24">
          <div className="flex items-center gap-2 mb-5 font-semibold text-black">
            <SlidersHorizontal size={16} />
            Filter
          </div>
          <div className="mb-5">
            <p className="text-xs font-semibold text-ast-gray uppercase tracking-wider mb-3">Category</p>
            {['All Categories', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded-lg mb-0.5 transition-colors ${
                  category === cat ? 'bg-ast-primary text-white font-medium' : 'text-ast-gray hover:text-black hover:bg-ast-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search services or tags…"
              className="w-full pl-10 pr-4 py-2.5 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
            />
          </div>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ast-primary"
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <p className="text-ast-gray text-sm mb-6">{filtered.length} services available</p>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-ast-gray">
              No services match your search.
            </motion.div>
          ) : (
            <motion.div
              key={category + query + sort}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filtered.map(gig => (
                <motion.div key={gig.id} variants={scaleIn}>
                  <Link href={`/gig/${gig.id}`} className="group block bg-white rounded-2xl border border-black/8 hover:border-ast-light/60 hover:shadow-md transition-all overflow-hidden">
                    <div className="h-36 bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center">
                      <span className="font-mono text-ast-light/30 text-[10px] tracking-widest2">{gig.category.toUpperCase()}</span>
                    </div>
                    <div className="p-4">
                      <span className="inline-block text-[11px] font-medium text-ast-primary bg-ast-muted rounded-full px-2 py-0.5 mb-2">{gig.category}</span>
                      <h3 className="font-heading font-semibold text-black text-sm leading-snug mb-3 group-hover:text-ast-primary transition-colors line-clamp-2">{gig.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {gig.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] bg-ast-surface text-ast-gray rounded-full px-2 py-0.5">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-ast-gray border-t border-black/5 pt-3">
                        <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />5.0</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{gig.deliveryDays}d</span>
                        <span className="font-semibold text-black text-sm">From ${gig.price}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
