'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Clock, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'

const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Fastest Delivery']

export function GigBrowser({ initialGigs, categories }: { initialGigs: any[]; categories: Category[] }) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Relevance')

  const filtered = useMemo(() => {
    let g = [...initialGigs]
    if (category !== 'All Categories') g = g.filter(x => x.category?.toLowerCase() === category.toLowerCase())
    if (query) g = g.filter(x => x.title?.toLowerCase().includes(query.toLowerCase()) || (x.tags && x.tags.some((t: string) => t.toLowerCase().includes(query.toLowerCase()))))
    if (sort === 'Price: Low to High') g.sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to Low') g.sort((a, b) => b.price - a.price)
    if (sort === 'Fastest Delivery')   g.sort((a, b) => a.deliveryDays - b.deliveryDays)
    return g
  }, [initialGigs, category, query, sort])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Category Sidebar Filter */}
      <aside className="lg:w-64 shrink-0">
        <div className="bg-white rounded-3xl border border-black/8 p-6 sticky top-24 shadow-sm">
          <div className="flex items-center gap-2 mb-4 font-bold text-black text-sm">
            <SlidersHorizontal size={15} />
            <span>Categories</span>
          </div>
          <div className="space-y-1">
            {['All Categories', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`block w-full text-left text-xs py-2 px-3 rounded-xl transition-all ${
                  category === cat ? 'bg-ast-primary text-white font-bold shadow-xs' : 'text-ast-gray hover:text-black hover:bg-ast-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Gigs Grid */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search services, skills, or tags…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/15 rounded-2xl text-xs outline-none focus:border-ast-primary"
            />
          </div>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white border border-black/15 rounded-2xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary font-medium"
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <p className="text-ast-gray text-xs mb-5 font-semibold">{filtered.length} service{filtered.length !== 1 ? 's' : ''} available</p>

        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 bg-white rounded-3xl border border-black/8 p-8 shadow-sm">
              <p className="text-ast-gray text-sm">No services match your search.</p>
            </motion.div>
          ) : (
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filtered.map(gig => {
                const flName = gig.freelancer?.name || 'Verified Freelancer'
                const flImage = gig.freelancer?.image
                const flInitials = flName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <motion.div key={gig.id} variants={scaleIn}>
                    <Link href={`/gig/${gig.id}`} className="group block bg-white rounded-3xl border border-black/8 hover:border-ast-primary/40 hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
                      <div className="h-40 bg-ast-surface overflow-hidden relative">
                        {gig.image ? (
                          <img src={gig.image} alt={gig.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center">
                            <span className="font-mono text-white/80 text-xs tracking-widest uppercase font-bold">{gig.category}</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {gig.category}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        {/* Freelancer Header */}
                        <div className="flex items-center gap-2.5">
                          {flImage ? (
                            <img src={flImage} alt="" className="w-7 h-7 rounded-full object-cover border border-black/10" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-ast-primary text-white flex items-center justify-center font-bold text-[10px]">
                              {flInitials}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-ast-dark truncate">{flName}</span>
                        </div>

                        <h3 className="font-bold text-black text-xs leading-snug group-hover:text-ast-primary transition-colors line-clamp-2">{gig.title}</h3>

                        {gig.tags && gig.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {gig.tags.slice(0, 2).map((t: string) => (
                              <span key={t} className="text-[10px] bg-ast-surface text-ast-gray rounded-full px-2 py-0.5 border border-black/5">{t}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-ast-gray border-t border-black/5 pt-3">
                          <span className="flex items-center gap-1 font-semibold text-black">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span>{gig.rating || 4.9}</span>
                          </span>
                          <span className="flex items-center gap-1"><Clock size={11} />{gig.deliveryDays}d delivery</span>
                          <span className="font-bold text-ast-primary text-sm">From {gig.price} TND</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
