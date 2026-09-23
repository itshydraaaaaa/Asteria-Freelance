'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Users, Briefcase, SlidersHorizontal, User } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'
import { useLanguage } from '@/components/providers/LanguageContext'

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
  const { t, currency } = useLanguage()
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Newest')

  const sortOptions = [
    { id: 'Newest', label: 'Newest' },
    { id: 'Budget: High to Low', label: t('sortPriceHigh') },
    { id: 'Budget: Low to High', label: t('sortPriceLow') },
    { id: 'Most Proposals', label: 'Most Proposals' },
  ]

  const getCategoryName = (name: string) => {
    switch (name) {
      case 'Web Development': return t('catWebDev')
      case 'Design': return t('catDesign')
      case 'Data Science': return t('catDataScience')
      case 'Marketing': return t('catMarketing')
      case 'Mobile': return t('catMobile')
      case 'Writing': return t('catWriting')
      case 'Video & Audio': return t('catVideoAudio')
      case 'Business': return t('catBusiness')
      default: return name
    }
  }

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
    <div>
      {/* Dynamic Translated Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">
            {t('jobsHeaderTag')}
          </p>
          <h1 className="font-heading font-bold text-5xl text-black">
            {t('jobsHeaderTitle')}
          </h1>
          <p className="text-ast-gray mt-3 text-lg">
            {filtered.length === 0 ? t('noServicesFound') : `${filtered.length} ${t('jobsHeaderSubtitle')}`}
          </p>
        </div>
        <Link
          href="/post-job"
          className="shrink-0 bg-ast-primary text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-ast-dark transition-colors shadow-sm"
        >
          {t('postJobButton')}
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl border border-black/8 p-6 sticky top-24 shadow-sm">
            <div className="flex items-center gap-2 mb-4 font-bold text-black text-sm">
              <SlidersHorizontal size={15} />
              <span>{t('filterCategories')}</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setCategory('All Categories')}
                className={`block w-full text-left text-xs py-2 px-3 rounded-xl transition-all ${
                  category === 'All Categories' ? 'bg-ast-primary text-white font-bold shadow-xs' : 'text-ast-gray hover:text-black hover:bg-ast-surface'
                }`}
              >
                {t('filterAllCategories')}
              </button>
              {categories.map(c => (
                <button
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  className={`block w-full text-left text-xs py-2 px-3 rounded-xl transition-all ${
                    category === c.name ? 'bg-ast-primary text-white font-bold shadow-xs' : 'text-ast-gray hover:text-black hover:bg-ast-surface'
                  }`}
                >
                  {getCategoryName(c.name)}
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
              {sortOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          <p className="text-ast-gray text-xs mb-5 font-semibold">
            {filtered.length} {t('navJobs')}
          </p>

          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 bg-white rounded-3xl border border-black/8 p-8 shadow-sm">
                <Briefcase size={32} className="text-ast-primary/30 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-black mb-1">{t('noServicesFound')}</h3>
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
                                {getCategoryName(job.category)}
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
                          <div className="text-right shrink-0">
                            <span className="font-bold text-black text-lg block">{Number(job.budget).toFixed(2)} {currency}</span>
                            <span className="text-[11px] text-ast-gray">Fixed Escrow Budget</span>
                          </div>
                        </div>

                        <p className="text-xs text-ast-gray line-clamp-2 leading-relaxed font-body">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs text-ast-gray">
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.slice(0, 4).map((s: string) => (
                              <span key={s} className="bg-ast-surface text-[10px] font-medium text-ast-gray px-2 py-0.5 rounded-full border border-black/5">
                                {s}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock size={12} /> {job.deliveryDays}d</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {job._count?.proposals ?? 0}</span>
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
    </div>
  )
}
