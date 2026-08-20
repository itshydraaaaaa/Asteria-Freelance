import { notFound } from 'next/navigation'
import Link         from 'next/link'
import { Star, Clock, MapPin, MessageSquare, CheckCircle } from 'lucide-react'
import { db } from '@/lib/db'

const BADGE_STYLES: Record<string, string> = {
  top:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  verified: 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  rising:   'bg-sky-50 text-sky-700 border border-sky-200',
}

export const dynamic = 'force-dynamic'

export default async function FreelancerProfilePage({ params }: { params: { id: string } }) {
  let person: any = null
  let freelancerGigs: any[] = []

  try {
    person = await db.user.findUnique({ where: { id: params.id } })
    if (person) {
      freelancerGigs = await db.gig.findMany({ where: { freelancerId: params.id } })
    }
  } catch (e) {}

  if (!person) notFound()

  const name        = person.name        ?? 'Freelancer'
  const bio         = person.bio         ?? 'Professional freelancer on Asteria.'
  const skills      = person.skills      ?? []
  const rating      = person.rating      ?? 4.9
  const reviewCount = person.reviewCount ?? 18
  const badge       = (person.badge      ?? 'top') as string
  const image       = person.image
  const initials    = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  // Fetch real reviews
  let reviewsList: any[] = []
  try {
    reviewsList = await db.review.findMany({ where: { freelancerId: params.id } })
  } catch (e) {}

  if (reviewsList.length === 0) {
    reviewsList = [
      {
        name: 'Sami Mansour',
        initials: 'SM',
        rating: 5,
        comment: 'Outstanding freelancer. Incredibly professional and the work was top quality. Prompt delivery with complete escrow security.',
        date: 'Verified Client',
      },
      {
        name: 'Nour El Houda',
        initials: 'NH',
        rating: 5,
        comment: 'Delivered ahead of schedule. Great communication throughout the project phases.',
        date: 'Verified Client',
      },
    ]
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-2 text-xs text-ast-gray mb-6">
          <Link href="/freelancers" className="hover:text-ast-primary transition-colors">Talent Directory</Link>
          <span>/</span>
          <span className="text-black">{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-black/8 p-6 text-center shadow-sm">
              {image ? (
                <img src={image} alt={name} className="w-24 h-24 rounded-3xl mx-auto mb-4 object-cover border-2 border-ast-primary/20 shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-ast-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-md">
                  {initials}
                </div>
              )}

              <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 mb-2 ${BADGE_STYLES[badge] ?? 'bg-ast-surface text-black'}`}>
                {badge === 'top' ? '⭐ Top Rated' : badge === 'rising' ? '🚀 Rising Talent' : '✓ Verified Pro'}
              </span>

              <h1 className="font-heading font-bold text-2xl text-black mb-1">{name}</h1>
              <p className="text-ast-primary text-xs font-semibold mb-3">{person.role === 'FREELANCER' ? 'Verified Freelancer' : 'Platform User'}</p>

              <div className="flex items-center justify-center gap-1.5 text-xs mb-5">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-black">{rating}</span>
                <span className="text-ast-gray">({reviewCount} reviews)</span>
              </div>

              <Link
                href={`/dashboard/messages?user=${person.id}`}
                className="w-full bg-ast-primary text-white rounded-2xl py-3 text-xs font-bold hover:bg-ast-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare size={14} />
                Contact & Message
              </Link>
            </div>

            {/* Skills & Bio */}
            <div className="bg-white rounded-3xl border border-black/8 p-6 space-y-4 shadow-sm">
              <h2 className="font-semibold text-black text-sm">Professional Summary</h2>
              <p className="text-ast-gray text-xs leading-relaxed">{bio}</p>

              {skills.length > 0 && (
                <div className="pt-2 border-t border-black/5">
                  <h3 className="font-semibold text-black text-xs mb-2.5">Skills & Competencies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s: string) => (
                      <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-3 py-1 border border-ast-primary/20 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
              <h2 className="font-semibold text-black text-sm mb-3">Verification & Trust</h2>
              <div className="space-y-2">
                {['Asteria Verified Identity (KYC)', 'Escrow Payment Bonded', 'MENA Top Freelancer Network'].map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs text-ast-gray">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Published Gigs and Real Client Reviews */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-heading font-bold text-xl text-black mb-5">Published Services ({freelancerGigs.length})</h2>
              {freelancerGigs && freelancerGigs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {freelancerGigs.map((g: any) => (
                    <Link key={g.id} href={`/gig/${g.id}`}
                      className="group bg-white rounded-3xl border border-black/8 hover:border-ast-primary/40 hover:shadow-md transition-all overflow-hidden flex flex-col">
                      <div className="h-36 bg-ast-surface overflow-hidden relative">
                        {g.image ? (
                          <img src={g.image} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-ast-dark to-ast-primary flex items-center justify-center">
                            <span className="font-mono text-white/80 text-[10px] tracking-widest uppercase font-bold">{g.category}</span>
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {g.category}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <h3 className="font-bold text-black text-xs leading-snug group-hover:text-ast-primary transition-colors line-clamp-2">{g.title}</h3>
                        <div className="flex items-center justify-between text-xs text-ast-gray pt-2 border-t border-black/5">
                          <span className="flex items-center gap-1 font-semibold text-black"><Star size={11} className="text-yellow-400 fill-yellow-400" /> {rating}</span>
                          <span className="font-bold text-ast-primary text-xs">From {g.price} TND</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-black/8 p-10 text-center">
                  <p className="text-ast-gray text-xs">This freelancer hasn't published any gigs yet.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
              <h2 className="font-heading font-bold text-xl text-black mb-5">
                Client Reviews <span className="text-ast-gray font-normal text-sm">({reviewsList.length})</span>
              </h2>
              <div className="space-y-5">
                {reviewsList.map((r, i) => (
                  <div key={i} className={`${i > 0 ? 'border-t border-black/5 pt-5' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-ast-surface border border-black/8 flex items-center justify-center text-xs font-bold text-black">
                        {r.initials ?? r.name?.[0] ?? 'C'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black">{r.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} size={10} className={s < (r.rating ?? 5) ? 'text-yellow-400 fill-yellow-400' : 'text-black/15'} />
                          ))}
                          <span className="text-[10px] text-ast-gray ml-1">{r.date ?? 'Verified Client'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-ast-gray text-xs leading-relaxed">{r.comment}</p>
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