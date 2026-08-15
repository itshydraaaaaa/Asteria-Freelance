'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Award, TrendingUp, CheckCircle } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger, microHover } from '@/lib/motion'

export function FreelancerBrowser({ freelancers, categories }: { freelancers: any[]; categories: Category[] }) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')
  const [badge,    setBadge]    = useState('All')

  const BADGE_CONFIG: Record<string, any> = {
    top:      { label: 'Top Rated',  Icon: Award,       color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    rising:   { label: 'Rising',     Icon: TrendingUp,  color: 'text-ast-sky bg-sky-50 border-sky-200' },
    verified: { label: 'Verified',   Icon: CheckCircle, color: 'text-ast-primary bg-ast-muted border-ast-light/40' },
  }

  const filtered = useMemo(() => {
    let f = [...freelancers]
    if (category !== 'All') f = f.filter(x => x.category === category)
    if (badge    !== 'All') f = f.filter(x => x.badge && x.badge.toLowerCase() === badge.toLowerCase())
    if (query) {
      const q = query.toLowerCase()
      f = f.filter(x => 
        (x.name && x.name.toLowerCase().includes(q)) || 
        (x.skills && x.skills.some((s: string) => s.toLowerCase().includes(q)))
      )
    }
    return f
  }, [freelancers, category, badge, query])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ast-gray" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or skill…" className="pl-9 pr-4 py-2.5 border border-black/15 rounded-xl text-sm w-64 outline-none focus:border-ast-primary" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c.slug}>{c.name}</option>)}
        </select>
        <select value={badge} onChange={e => setBadge(e.target.value)} className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="All">All Badges</option>
          <option value="top">Top Rated</option>
          <option value="rising">Rising</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      <p className="text-ast-gray text-sm mb-6">{filtered.length} freelancers found</p>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-ast-gray">
            No freelancers match your filters.
          </motion.div>
        ) : (
          <motion.div key={category + badge + query} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(f => {
              const bc = f.badge ? BADGE_CONFIG[f.badge.toLowerCase()] : null
              const initials = f.name ? f.name[0].toUpperCase() : '?'
              const skills = f.skills || []
              const hourlyRate = f.hourlyRate || f.startingPrice || 0
              const rating = f.rating || 0
              const reviewCount = f.reviewCount || 0

              return (
                <motion.div key={f.id} variants={scaleIn}>
                  {/* 👉 FIXED LINK: Points to /freelancers/ instead of /profile/ */}
                  <Link href={`/freelancers/${f.id}`} className="group block bg-white rounded-2xl border border-black/8 p-5 hover:border-ast-light/60 hover:shadow-md transition-all">
                    <motion.div variants={microHover} initial="rest" whileHover="hover" whileTap={{ scale: 0.995 }}>
                      <div className="flex items-center gap-3 mb-4">
                        {f.image ? (
                          <img src={f.image} alt={f.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-black/5" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-black text-sm group-hover:text-ast-primary transition-colors truncate">{f.name}</p>
                          <p className="text-xs text-ast-gray truncate">{f.category || 'Freelancer'}</p>
                        </div>
                      </div>

                      <div className="h-7 mb-2">
                        {bc && (
                          <div className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs font-medium ${bc.color}`}>
                            <bc.Icon size={11} />
                            {bc.label}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                        {skills.length > 0 ? (
                          skills.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[11px] bg-ast-surface text-ast-gray rounded-full px-2 py-0.5">{s}</span>
                          ))
                        ) : (
                          <span className="text-[11px] text-black/30 italic">No skills listed</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-black/5 pt-3">
                        <span className="flex items-center gap-1 text-ast-gray"><Star size={11} className={rating > 0 ? "text-yellow-400 fill-yellow-400" : ""} />{rating} ({reviewCount})</span>
                        <span className="font-semibold text-black">From ${hourlyRate}/hr</span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}