'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Clock, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/lib/data/categories'
import { scaleIn, stagger } from '@/lib/motion'
import { expandTunisianSearchQuery } from '@/lib/ai/tunbert'
import { useLanguage } from '@/components/providers/LanguageContext'

export function GigBrowser({ initialGigs, categories }: { initialGigs: any[]; categories: Category[] }) {
  const { t, currency } = useLanguage()
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sort,     setSort]     = useState('Relevance')

  const sortOptions = [
    { id: 'Relevance', label: t('sortRelevance') },
    { id: 'Price: Low to High', label: t('sortPriceLow') },
    { id: 'Price: High to Low', label: t('sortPriceHigh') },
    { id: 'Fastest Delivery', label: t('sortFastest') },
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
    let g = [...initialGigs]
    if (category !== 'All Categories') g = g.filter(x => x.category?.toLowerCase() === category.toLowerCase())
    if (query) {
      const searchTerms = expandTunisianSearchQuery(query)
      g = g.filter(x => {
        const titleLower = (x.title || '').toLowerCase()
        const tagsLower = Array.isArray(x.tags) ? x.tags.map((t: string) => t.toLowerCase()) : []
        const catLower = (x.category || '').toLowerCase()
        return searchTerms.some(term => {
          const tLower = term.toLowerCase()
          return titleLower.includes(tLower) || tagsLower.some((t: string) => t.includes(tLower)) || catLower.includes(tLower)
        })
      })
    }
    if (sort === 'Price: Low to High') g.sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to Low') g.sort((a, b) => b.price - a.price)
    if (sort === 'Fastest Delivery')   g.sort((a, b) => a.deliveryDays - b.deliveryDays)
    return g
  }, [initialGigs, category, query, sort])

  return (
    <div>
      {/* Dynamic Translated Page Header */}
      <div className="mb-10">
        <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-2">
          {t('exploreHeaderTag')}
        </p>
        <h1 className="font-heading font-bold text-5xl text-black">
          {t('exploreHeaderTitle')}
        </h1>
        <p className="text-ast-gray mt-3 text-lg">
          {filtered.length === 0 ? t('noServicesFound') : `${filtered.length} ${t('catLiveServices')} — ${t('exploreHeaderSubtitle')}`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category Sidebar Filter */}
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

        {/* Main Gigs Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('searchServicesPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/15 rounded-2xl text-xs outline-none focus:border-ast-primary"
              />
            </div>
            <select
              value={sort} onChange={e => setSort(e.target.value)}
              className="bg-white border border-black/15 rounded-2xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary font-medium"
            >
              {sortOptions.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <p className="text-ast-gray text-xs mb-5 font-semibold">
            {filtered.length} {t('catLiveServices')}
          </p>

          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 bg-white rounded-3xl border border-black/8 p-8 shadow-sm">
                <p className="text-ast-gray text-sm">{t('noServicesFound')}</p>
                <button
                  onClick={() => { setCategory('All Categories'); setQuery(''); }}
                  className="mt-3 text-xs text-ast-primary font-bold hover:underline"
                >
                  {t('clearFilters')}
                </button>
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
                            {getCategoryName(gig.category)}
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          {/* Freelancer Header */}
                          <div className="flex items-center gap-2.5">
                            {flImage ? (
                              <img src={flImage} alt={flName} className="w-7 h-7 rounded-full object-cover border border-black/10" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-ast-primary text-white text-[10px] font-bold flex items-center justify-center">
                                {flInitials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-black truncate">{flName}</p>
                              <p className="text-[10px] text-ast-gray">{gig.freelancer?.title || 'Specialist'}</p>
                            </div>
                          </div>

                          <h3 className="font-heading font-semibold text-black text-sm leading-snug line-clamp-2 group-hover:text-ast-primary transition-colors">
                            {gig.title}
                          </h3>

                          <div className="pt-3 border-t border-black/6 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-ast-gray">
                              <span className="flex items-center gap-1 font-semibold text-black">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                {Number(gig.rating ?? 5.0).toFixed(1)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {gig.deliveryDays}d
                              </span>
                            </div>
                            <span className="font-bold text-black">{Number(gig.price).toFixed(2)} {currency}</span>
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
