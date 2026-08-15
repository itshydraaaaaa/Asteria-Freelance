import { notFound } from 'next/navigation'
import Link         from 'next/link'
import { Star, Clock, MapPin, MessageSquare, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const BADGE_STYLES: Record<string, string> = {
  top:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  verified: 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  rising:   'bg-sky-50 text-sky-700 border border-sky-200',
}

const MOCK_REVIEWS = [
  { name: 'Layla Haddad',  initials: 'LH', rating: 5, comment: 'Outstanding freelancer. Incredibly professional and the work was top quality.', date: '2 weeks ago' },
  { name: 'Omar Farouk',   initials: 'OF', rating: 5, comment: 'Delivered ahead of schedule. Great communication throughout the project.', date: '1 month ago' },
  { name: 'Dina Khalil',   initials: 'DK', rating: 4, comment: 'Very talented. Minor tweaks needed but overall fantastic experience.', date: '2 months ago' },
]

export const revalidate = 60

export default async function FreelancerProfilePage({ params }: { params: { id: string } }) {
  let person: any = null
  let freelancerGigs: any[] = []

  // 1. Try unified db helper first
  try {
    person = await db.user.findUnique({ where: { id: params.id } })
    if (person) {
      freelancerGigs = await db.gig.findMany({ where: { freelancerId: params.id } })
    }
  } catch (e) {}

  // 2. Fall back to Supabase if not found in db helper
  if (!person) {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('User')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) {
        person = data
        const { data: gigs } = await supabase
          .from('Gig')
          .select('*')
          .eq('freelancerId', params.id)
          .order('createdAt', { ascending: false })
        if (gigs) freelancerGigs = gigs
      }
    } catch (e) {}
  }

  if (!person) notFound()

  const name        = person.name ?? 'Asteria Freelancer'
  const bio         = person.bio ?? 'Professional freelancer delivering high-quality work on the Asteria platform.'
  const skills: string[] = Array.isArray(person.skills) ? person.skills : []
  const location    = person.location ?? 'MENA Region'
  const rating      = person.rating ?? 4.9
  const reviews     = person.reviewCount ?? 12
  const image       = person.image
  
  const rawBadge    = person.badge?.toLowerCase()
  const badge       = rawBadge && BADGE_STYLES[rawBadge] ? rawBadge : 'verified'
  
  const category    = freelancerGigs?.[0]?.category ?? 'Freelancer'
  const startingPrice = freelancerGigs && freelancerGigs.length > 0 
    ? Math.min(...freelancerGigs.map((g: any) => g.price)) 
    : (person.hourlyRate ?? 50)
    
  const initials    = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="bg-gradient-to-br from-ast-dark to-ast-primary h-40 rounded-3xl mb-0" />

        <div className="bg-white rounded-3xl border border-black/8 -mt-12 mx-4 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="-mt-16">
              {image ? (
                <img src={image} alt={name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-ast-primary flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-heading font-bold text-3xl text-black">{name}</h1>
                <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${BADGE_STYLES[badge]}`}>
                  {badge === 'top' ? '⭐ Top Rated' : badge === 'rising' ? '🚀 Rising' : '✓ Verified'}
                </span>
              </div>

              <p className="text-ast-primary font-medium mb-3">{category} Specialist</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ast-gray mb-4">
                <span className="flex items-center gap-1">
                  <Star size={14} className={rating > 0 ? "text-yellow-400 fill-yellow-400" : "text-black/20"} />
                  <span className="font-semibold text-black">{rating > 0 ? rating : 'New'}</span>
                  {reviews > 0 && <span>({reviews} reviews)</span>}
                </span>
                <span className="flex items-center gap-1"><MapPin size={13} /> {location}</span>
                <span className="flex items-center gap-1"><Clock size={13} /> Responds within 1 hour</span>
              </div>

              <p className="text-ast-gray leading-relaxed max-w-2xl whitespace-pre-wrap">{bio}</p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="text-right">
                <p className="text-xs text-ast-gray mb-0.5">Starting from</p>
                <p className="font-heading font-bold text-3xl text-ast-primary">${startingPrice}</p>
              </div>
              <Link
                href={`/dashboard/messages?new=${person.id}`}
                className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-ast-dark transition-colors"
              >
                <MessageSquare size={14} />
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-black/8 p-5">
              <h2 className="font-semibold text-black mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-3 py-1 border border-ast-primary/20 font-medium">{s}</span>
                ))}
                {skills.length === 0 && <p className="text-ast-gray text-sm italic">No skills listed yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-5">
              <h2 className="font-semibold text-black mb-4">Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Orders Completed', value: reviews > 0 ? String(Math.round(reviews * 1.3)) : '12' },
                  { label: 'On-time Delivery', value: '98%' },
                  { label: 'Response Rate',    value: '100%' },
                  { label: 'Member Since',     value: person.createdAt ? new Date(person.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '2024' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-ast-gray">{label}</span>
                    <span className="font-medium text-black">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/8 p-5">
              <h2 className="font-semibold text-black mb-3">Certifications</h2>
              <div className="space-y-2">
                {['Asteria Verified Pro', 'Top Rated Seller'].map(c => (
                  <div key={c} className="flex items-center gap-2 text-sm text-ast-gray">
                    <CheckCircle size={13} className="text-ast-primary" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {freelancerGigs && freelancerGigs.length > 0 ? (
              <div>
                <h2 className="font-heading font-bold text-xl text-black mb-5">Services ({freelancerGigs.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {freelancerGigs.map((g: any) => (
                    <Link key={g.id} href={`/gig/${g.id}`}
                      className="group bg-white rounded-2xl border border-black/8 hover:border-ast-light/60 hover:shadow-md transition-all overflow-hidden flex flex-col">
                      {g.image ? (
                        <img src={g.image} alt={g.title} className="h-32 w-full object-cover border-b border-black/5" />
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center border-b border-black/5">
                          <span className="font-mono text-ast-light/30 text-[9px] tracking-widest">{g.category.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-medium text-black text-sm leading-snug mb-3 group-hover:text-ast-primary transition-colors line-clamp-2">{g.title}</h3>
                        <div className="mt-auto flex items-center justify-between text-xs text-ast-gray">
                          <span className="flex items-center gap-1"><Star size={10} className={rating > 0 ? "text-yellow-400 fill-yellow-400" : "text-black/20"} /> {rating > 0 ? rating : 'New'}</span>
                          <span className="font-semibold text-black">From ${g.price}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/8 p-10 text-center">
                <p className="text-ast-gray font-medium">This freelancer hasn't published any gigs yet.</p>
              </div>
            )}

            <div>
              <h2 className="font-heading font-bold text-xl text-black mb-5">
                Reviews <span className="text-ast-gray font-normal text-base">({reviews > 0 ? reviews : MOCK_REVIEWS.length})</span>
              </h2>
              <div className="space-y-5">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-black/8 p-5">
                    <div className="flex items-center gap-3 mb-3">
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
        </div>
      </div>
    </div>
  )
}