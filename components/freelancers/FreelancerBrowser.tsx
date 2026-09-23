'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Award, TrendingUp, CheckCircle } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger, microHover } from '@/lib/motion'
import { expandTunisianSearchQuery } from '@/lib/ai/tunbert'
import { useLanguage } from '@/components/providers/LanguageContext'

export function FreelancerBrowser({ freelancers, categories }: { freelancers: any[]; categories: Category[] }) {
  const { t, currency } = useLanguage()
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')
  const [badge,    setBadge]    = useState('All')

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

  const BADGE_CONFIG: Record<string, any> = {
    top:      { label: 'Top Rated',  Icon: Award,       color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    rising:   { label: 'Rising',     Icon: TrendingUp,  color: 'text-ast-sky bg-sky-50 border-sky-200' },
    verified: { label: 'Verified',   Icon: CheckCircle, color: 'text-ast-primary bg-ast-muted border-ast-light/40' },
  }

  const filtered = useMemo(() => {
    let f = [...freelancers]
    if (category !== 'All') {
      const catLower = category.toLowerCase()
      f = f.filter(x => {
        const xCat = (x.category || '').toLowerCase()
        const matchCat = xCat === catLower || xCat.includes(catLower)
        const matchSkills = Array.isArray(x.skills) && x.skills.some((s: string) => s.toLowerCase().includes(catLower))
        return matchCat || matchSkills
      })
    }
    if (badge !== 'All') f = f.filter(x => x.badge && x.badge.toLowerCase() === badge.toLowerCase())
    if (query) {
      const searchTerms = expandTunisianSearchQuery(query)
      f = f.filter(x => {
        const nameLower = (x.name || '').toLowerCase()
        const catLower = (x.category || '').toLowerCase()
        const locLower = (x.location || '').toLowerCase()
        const skillsLower = Array.isArray(x.skills) ? x.skills.map((s: string) => s.toLowerCase()) : []
        return searchTerms.some(term => {
          const tLower = term.toLowerCase()
          return (
            nameLower.includes(tLower) ||
            catLower.includes(tLower) ||
            locLower.includes(tLower) ||
            skillsLower.some((s: string) => s.includes(tLower))
          )
        })
      })
    }
    return f
  }, [freelancers, category, badge, query])

  return (
    <div>
      {/* Dynamic Translated Header */}
      <div className="mb-10">
        <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">
          {t('freelancersHeaderTag')}
        </p>
        <h1 className="font-heading font-bold text-5xl text-black">
          {t('freelancersHeaderTitle')}
        </h1>
        <p className="text-ast-gray mt-3 text-lg">
          {filtered.length} {t('freelancersHeaderSubtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ast-gray" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchFreelancersPlaceholder')}
            className="pl-9 pr-4 py-2.5 border border-black/15 rounded-xl text-sm w-72 outline-none focus:border-ast-primary"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none"
        >
          <option value="All">{t('filterAllCategories')}</option>
          {categories.map(c => (
            <option key={c.slug} value={c.name}>{getCategoryName(c.name)}</option>
          ))}
        </select>
        <select
          value={badge}
          onChange={e => setBadge(e.target.value)}
          className="border border-black/15 rounded-xl px-3 py-2.5 text-sm outline-none"
        >
          <option value="All">All Badges</option>
          <option value="top">Top Rated</option>
          <option value="rising">Rising</option>
          <option value="verified">Verified (CIN)</option>
        </select>
      </div>

      <p className="text-ast-gray text-sm mb-6">{filtered.length} {t('navFreelancers')}</p>

      <AnimatePresence>
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 text-ast-gray">
            {t('noServicesFound')}
          </motion.div>
        ) : (
          <motion.div key={category + badge} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(f => {
              const bc = f.badge ? BADGE_CONFIG[f.badge.toLowerCase()] : null
              const initials = f.name ? f.name[0].toUpperCase() : '?'
              const skills = f.skills || []
              const hourlyRate = f.hourlyRate || f.startingPrice || 0
              const rating = f.rating || 0
              const reviewCount = f.reviewCount || 0

              return (
                <motion.div key={f.id} variants={scaleIn}>
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
                          <p className="text-xs text-ast-gray truncate flex items-center gap-1">
                            <span>{getCategoryName(f.category) || 'Freelancer'}</span>
                            <span>•</span>
                            <span className="text-[11px] text-ast-primary/90 font-medium">🇹🇳 {f.location || 'Tunisia'}</span>
                          </p>
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
                        <span className="font-bold text-ast-primary">{hourlyRate} {currency}/hr</span>
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