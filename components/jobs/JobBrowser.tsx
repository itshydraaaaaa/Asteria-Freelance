'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Users, Briefcase, SlidersHorizontal, User } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'

const SORT_OPTIONS = ['Newest', 'Budget: High to Low', 'Budget: Low to High', 'Most Proposals']

interface Job {
  id: string
  title: string
  description: string
  category: string
  budget: number
  deliveryDays: number
  skills: string[]
  status: string
  createdAt: string
  client?: { id?: string; name?: string | null }
  _count?: { proposals: number }
}

export function JobBrowser({ initialJobs, categories }: { initialJobs: Job[]; categories: Category[] }) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Newest')

  const filtered = useMemo(() => {
    let j = [...initialJobs]
    if (category !== 'All Categories') j = j.filter(x => x.category?.toLowerCase() === category.toLowerCase())
    if (query) j = j.filter(x =>
      x.title.toLowerCase().includes(query.toLowerCase()) ||
      x.description.toLowerCase().includes(query.toLowerCase()) ||
      x.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
    )
    if (sort === 'Budget: High to Low') j.sort((a, b) => b.budget - a.budget)
    if (sort === 'Budget: Low to High') j.sort((a, b) => a.budget - b.budget)
    if (sort === 'Most Proposals')     j.sort((a, b) => (b._count?.proposals ?? 0) - (a._count?.proposals ?? 0))
    return j
  }, [initialJobs, category, query, sort])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Category Sidebar */}
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

      {/* Main Jobs Board */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search projects, client requirements, or skills…"
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

        <p className="text-ast-gray text-xs mb-5 font-semibold">{filtered.length} open project{filtered.length !== 1 ? 's' : ''}</p>

        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 bg-white rounded-3xl border border-black/8 p-8 shadow-sm">
              <Briefcase size={32} className="text-ast-primary/30 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-black mb-1">No open projects found</h3>
              <p className="text-ast-gray text-xs mb-4">Try clearing search filters or check back shortly.</p>
            </motion.div>
          ) : (
            <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              {filtered.map(job => {
                const clientName = job.client?.name || 'Verified Client'

                return (
                  <motion.div key={job.id} variants={scaleIn}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="group block bg-white rounded-3xl border border-black/8 hover:border-ast-primary/40 hover:shadow-md transition-all p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block text-[10px] font-bold text-ast-primary bg-ast-muted rounded-full px-2.5 py-0.5">
                              {job.category}
                            </span>
                            <span className="text-[11px] text-ast-gray flex items-center gap-1 font-medium">
                              <User size={11} className="text-ast-primary" />
                              <span>{clientName}</span>
                            </span>
                          </div>
                          <h3 className="font-heading font-bold text-base text-black group-hover:text-ast-primary transition-colors leading-snug">
                            {job.title}
                          </h3>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <p className="font-heading font-bold text-xl text-ast-primary">{job.budget} TND</p>
                          <p className="text-[10px] text-ast-gray">Escrow Budget</p>
                        </div>
                      </div>

                      <p className="text-ast-gray text-xs leading-relaxed line-clamp-2">{job.description}</p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 5).map(s => (
                            <span key={s} className="text-[10px] bg-ast-surface text-ast-dark font-medium rounded-full px-2.5 py-0.5 border border-black/5">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-xs text-ast-gray border-t border-black/5 pt-3 gap-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1"><Clock size={12} /> {job.deliveryDays}d delivery</span>
                          <span className="flex items-center gap-1 text-black font-semibold"><Users size={12} /> {job._count?.proposals ?? 0} proposal{job._count?.proposals !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[11px] text-ast-gray">{new Date(job.createdAt).toLocaleDateString()}</span>
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
