import { notFound }  from 'next/navigation'
import Link          from 'next/link'
import { Star, Clock, RefreshCw, Check, ChevronRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const BADGE_STYLES: Record<string, string> = {
  top:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  verified: 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  rising:   'bg-sky-50 text-sky-700 border border-sky-200',
}

const MOCK_REVIEWS = [
  { name: 'Ali Hassan',     initials: 'AH', rating: 5, comment: 'Exceptional work. Delivered on time and went above and beyond. Will hire again.', date: '3 weeks ago' },
  { name: 'Mona Rashid',    initials: 'MR', rating: 5, comment: 'Professional, communicative, and the final result exceeded expectations.', date: '1 month ago' },
  { name: 'Khaled Nasser',  initials: 'KN', rating: 4, comment: 'Very good quality. Minor revision needed but handled quickly.', date: '2 months ago' },
]

export const revalidate = 60 

export default async function GigDetailPage({ params }: { params: { id: string } }) {
  let gig: any = null

  // 1. Try unified db helper first
  try {
    gig = await db.gig.findUnique({ where: { id: params.id } })
  } catch (e) {}

  // 2. Fall back to Supabase if not found
  if (!gig) {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('Gig')
        .select('*, freelancer:User(id, name, bio, image, skills, rating, reviewCount, badge)')
        .eq('id', params.id)
        .single()
      if (data) gig = data
    } catch (e) {}
  }

  if (!gig) notFound()

  const freelancer = gig.freelancer ?? {
    id: gig.freelancerId,
    name: 'Karim Benali',
    bio: 'Expert full-stack developer with 6+ years experience.',
    skills: ['TypeScript', 'Next.js', 'PostgreSQL'],
    rating: 4.9,
    reviewCount: 18,
    badge: 'top'
  }

  const title        = gig.title
  const description  = gig.description
  const category     = gig.category
  const price        = gig.price
  const deliveryDays = gig.deliveryDays
  const tags         = gig.tags ?? []
  const image        = gig.image

  const flName     = freelancer?.name  ?? 'Asteria Freelancer'
  const flBio      = freelancer?.bio   ?? 'Professional freelancer on Asteria.'
  const flSkills   = freelancer?.skills ?? []
  const flRating   = freelancer?.rating ?? 4.9
  const flReviews  = freelancer?.reviewCount ?? 18
  const flImage    = freelancer?.image
  const flInitials = flName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  
  const rawBadge = freelancer?.badge?.toLowerCase()
  const badge    = rawBadge && BADGE_STYLES[rawBadge] ? rawBadge : 'verified'

  const packages = [
    { label: 'Basic',    price: Math.round(price * 0.6),  deliveryDays: deliveryDays + 2, revisions: 1, features: ['Source files', '1 concept', 'Commercial use'] },
    { label: 'Standard', price,                           deliveryDays,                   revisions: 3, features: ['Source files', '3 concepts', 'Commercial use', 'Priority support'] },
    { label: 'Premium',  price: Math.round(price * 1.6),  deliveryDays: Math.ceil(deliveryDays * 0.7), revisions: 999, features: ['Source files', 'Unlimited concepts', 'Commercial use', 'Dedicated support', 'Express delivery'] },
  ]

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-2 text-xs text-ast-gray mb-6">
          <Link href="/explore" className="hover:text-ast-primary transition-colors">Explore</Link>
          <ChevronRight size={12} />
          <Link href={`/explore?category=${encodeURIComponent(category)}`} className="hover:text-ast-primary transition-colors">{category}</Link>
          <ChevronRight size={12} />
          <span className="text-black truncate max-w-xs">{title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <span className="inline-block text-xs font-medium text-ast-primary bg-ast-muted rounded-full px-3 py-1 mb-3">{category}</span>
              <h1 className="font-heading font-bold text-3xl text-black leading-tight mb-4">{title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-ast-gray">
                <span className="flex items-center gap-1">
                  <Star size={14} className={flRating > 0 ? "text-yellow-400 fill-yellow-400" : "text-black/20"} />
                  <span className="font-semibold text-black">{flRating > 0 ? flRating : 'New'}</span>
                  {flReviews > 0 && <span>({flReviews} reviews)</span>}
                </span>
                <span className="flex items-center gap-1"><Clock size={13} /> {deliveryDays}-day delivery</span>
              </div>
            </div>

            {image ? (
              <img src={image} alt={title} className="w-full aspect-video object-cover rounded-2xl border border-black/8" />
            ) : (
              <div className="bg-gradient-to-br from-ast-dark to-ast-primary rounded-2xl aspect-video flex items-center justify-center">
                <span className="font-mono text-ast-light/30 text-xs tracking-[0.3em] uppercase">{category}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-black/8 p-6">
              <h2 className="font-semibold text-black text-lg mb-4">About this service</h2>
              <p className="text-ast-gray leading-relaxed whitespace-pre-wrap">{description}</p>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-black/5">
                  <Tag size={13} className="text-ast-gray mt-0.5" />
                  {tags.map((t: string) => (
                    <span key={t} className="text-xs bg-ast-surface text-ast-gray rounded-full px-3 py-1 border border-black/8">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-6">
              <h2 className="font-semibold text-black text-lg mb-5">About the freelancer</h2>
              <div className="flex items-start gap-4">
                {flImage ? (
                  <img src={flImage} alt={flName} className="w-14 h-14 rounded-full object-cover shrink-0 border border-black/10" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {flInitials}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-black">{flName}</h3>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${BADGE_STYLES[badge]}`}>
                      {badge === 'top' ? '⭐ Top Rated' : badge === 'rising' ? '🚀 Rising' : '✓ Verified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm mb-3">
                    <Star size={12} className={flRating > 0 ? "text-yellow-400 fill-yellow-400" : "text-black/20"} />
                    <span className="font-medium text-black">{flRating > 0 ? flRating : 'No reviews yet'}</span>
                    {flReviews > 0 && <span className="text-ast-gray">· {flReviews} reviews</span>}
                  </div>
                  <p className="text-ast-gray text-sm leading-relaxed mb-3">{flBio}</p>
                  {flSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(flSkills) ? flSkills : []).map((s: string) => (
                        <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-2.5 py-0.5 border border-ast-primary/20">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-black/5">
                <Link href={`/freelancers/${gig.freelancerId}`} className="text-sm text-ast-primary font-medium hover:underline">
                  View full profile →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-6">
              <h2 className="font-semibold text-black text-lg mb-5">
                Reviews <span className="text-ast-gray font-normal text-base">({MOCK_REVIEWS.length})</span>
              </h2>
              <div className="space-y-5">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className={`${i > 0 ? 'border-t border-black/5 pt-5' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-ast-surface border border-black/8 flex items-center justify-center text-xs font-bold text-black">
                        {r.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{r.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} size={11} className={s < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-black/15'} />
                          ))}
                          <span className="text-xs text-ast-gray ml-1">{r.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-ast-gray text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden sticky top-24">
              <div className="flex border-b border-black/8">
                {packages.map((pkg, i) => (
                  <button key={i} className={`flex-1 py-3 text-xs font-semibold transition-colors ${i === 1 ? 'bg-ast-primary text-white' : 'text-ast-gray hover:text-black'}`}>
                    {pkg.label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-heading font-bold text-3xl text-black">${packages[1].price}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-ast-gray mb-5">
                  <span className="flex items-center gap-1"><Clock size={12} /> {packages[1].deliveryDays} days delivery</span>
                  <span className="flex items-center gap-1"><RefreshCw size={12} /> {packages[1].revisions} revisions</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {packages[1].features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ast-gray">
                      <Check size={14} className="text-ast-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full text-center bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors shadow-sm"
                >
                  Order Service — ${packages[1].price}
                </Link>
                <Link
                  href={`/freelancers/${gig.freelancerId}`}
                  className="block w-full text-center border border-black/15 text-black rounded-xl py-2.5 text-sm mt-3 hover:bg-ast-surface transition-colors"
                >
                  Contact Freelancer
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-5">
              <h3 className="font-semibold text-black text-sm mb-3">This service includes</h3>
              <ul className="space-y-2">
                {[`${deliveryDays}-day delivery`, '3 revision rounds', 'Source files', 'Commercial licence', '14-day support'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-xs text-ast-gray">
                    <Check size={12} className="text-ast-primary shrink-0" />{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}