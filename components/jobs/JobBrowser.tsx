'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Users, DollarSign, Briefcase } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'

const SORT_OPTIONS = ['Newest', 'Budget: High', 'Budget: Low', 'Most Proposals']

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
  client?: { name?: string | null }
  _count?: { proposals: number }
}

export function JobBrowser({ initialJobs, categories }: { initialJobs: Job[]; categories: Category[] }) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Newest')

  const filtered = useMemo(() => {
    let j = [...initialJobs]
    if (category !== 'All Categories') j = j.filter(x => x.category === category)
    if (query) j = j.filter(x =>
      x.title.toLowerCase().includes(query.toLowerCase()) ||
      x.description.toLowerCase().includes(query.toLowerCase()) ||
      x.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
    )
    if (sort === 'Budget: High')    j.sort((a, b) => b.budget - a.budget)
    if (sort === 'Budget: Low')     j.sort((a, b) => a.budget - b.budget)
    if (sort === 'Most Proposals')  j.sort((a, b) => (b._count?.proposals ?? 0) - (a._count?.proposals ?? 0))
    return j
  }, [initialJobs, category, query, sort])

  if (initialJobs.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-ast-primary/10 flex items-center justify-center mx-auto mb-5">
          <Briefcase size={28} className="text-ast-primary" />
        </div>
        <h3 className="font-heading font-bold text-xl text-black mb-2">No jobs yet</h3>
        <p className="text-ast-gray mb-6">Be the first to post a project and find elite MENA talent.</p>
        <Link href="/post-job" className="bg-ast-primary text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-ast-dark transition-colors">
          Post the First Job
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-60 shrink-0">
        <div className="bg-white rounded-2xl border border-black/8 p-5 sticky top-24">
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
      </aside>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search projects or skills…"
              className="w-full pl-10 pr-4 py-2.5 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
            />
          </div>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ast-primary bg-white"
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <p className="text-ast-gray text-sm mb-6">{filtered.length} open projects</p>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-ast-gray">
              No projects match your search.
            </motion.p>
          ) : (
            <motion.div key={category + query + sort} variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              {filtered.map(job => (
                <motion.div key={job.id} variants={scaleIn}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group block bg-white rounded-2xl border border-black/8 hover:border-ast-light/60 hover:shadow-md transition-all p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <span className="inline-block text-[11px] font-medium text-ast-primary bg-ast-muted rounded-full px-2 py-0.5 mb-2">{job.category}</span>
                        <h3 className="font-heading font-semibold text-black text-base group-hover:text-ast-primary transition-colors leading-snug">{job.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-xl text-ast-primary">${job.budget.toLocaleString()}</p>
                        <p className="text-xs text-ast-gray">Budget</p>
                      </div>
                    </div>

                    <p className="text-ast-gray text-sm leading-relaxed line-clamp-2 mb-4">{job.description}</p>

                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 5).map(s => (
                          <span key={s} className="text-[11px] bg-ast-surface text-ast-gray rounded-full px-2 py-0.5 border border-black/5">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ast-gray border-t border-black/5 pt-3">
                      <span className="flex items-center gap-1"><DollarSign size={11} /> Budget: ${job.budget}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {job.deliveryDays} days</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {job._count?.proposals ?? 0} proposals</span>
                      <span className="ml-auto">{new Date(job.createdAt).toLocaleDateString()}</span>
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
