'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import gsap from 'gsap'
import { Search, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'
import { LoadingScreen } from '@/components/loading/LoadingScreen'
import { Tilt3DCard } from '@/components/ui/Tilt3DCard'

const HeroCanvas = dynamic(() => import('@/components/3d/HeroCanvas'), { ssr: false })
const LogoModel  = dynamic(() => import('@/components/3d/LogoModel'),  { ssr: false })

function formatCompact(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000)    return (v / 1000).toFixed(0) + 'K'
  return String(v)
}

export function HeroSection() {
  const [showLoader, setShowLoader] = useState(false)
  const [showScroll, setShowScroll] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const wordsRef = useRef<HTMLSpanElement[]>([])
  const statRefs = useRef<HTMLSpanElement[]>([])
  const [statsData, setStatsData] = useState({
    freelancerCount: 12,
    successRate: 99.4,
    avgDeliveryHours: 24,
    totalPaidOut: 2400,
  })

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('ast-loaded')) {
        setShowLoader(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStatsData({
            freelancerCount: data.freelancerCount || 12,
            successRate: data.successRate || 99.4,
            avgDeliveryHours: data.avgDeliveryHours || 24,
            totalPaidOut: data.totalPaidOut || 2400,
          })
        }
      } catch {}
    }
    loadStats()
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY < 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dynamicStats = [
    { value: statsData.freelancerCount,   label: 'Verified Freelancers', suffix: '+' },
    { value: statsData.successRate,        label: 'Escrow Success Rate', suffix: '%' },
    { value: statsData.avgDeliveryHours,   label: 'Avg Delivery Hours', suffix: 'h' },
    { value: statsData.totalPaidOut,       label: 'Secured Payments', prefix: '$', compact: true },
  ]

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(wordsRef.current, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.1,
      })
    })
    return () => mm.revert()
  }, [])

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      dynamicStats.forEach((s, i) => {
        const el = statRefs.current[i]
        if (!el) return
        gsap.to({ val: 0 }, {
          val: s.value, duration: 1.4, delay: 0.2,
          ease: 'power2.out', snap: { val: 0.1 },
          onUpdate() {
            const v = (this.targets()[0] as any).val
            el.textContent = s.compact ? formatCompact(v) : String(Number(v).toFixed(s.value % 1 === 0 ? 0 : 1))
          },
        })
      })
    })
    return () => mm.revert()
  }, [statsData])

  const WORDS = ['HIRING', 'REDEFINED', 'WITH ESCROW']

  const handleComplete = () => setShowLoader(false)

  return (
    <>
      {showLoader && <LoadingScreen onComplete={handleComplete} />}

      <section
        className="relative min-h-screen flex items-center overflow-hidden bg-ast-dark"
      >
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-0">
          <HeroCanvas />
        </div>

        {/* Subtle Ambient Radial Glow Overlays - Allows 3D canvas to shine through */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,58,64,0.65)_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-ast-light/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-ast-primary/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Main Content Area */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-28 lg:py-36">
          
          {/* Left Column Text & Controls */}
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-8">
              <Sparkles size={14} className="text-ast-light animate-pulse" />
              <span className="font-mono text-ast-light text-[11px] tracking-[0.2em] uppercase font-semibold">
                ✨ Asteria — Escrow-Protected Freelance Marketplace, Made in Tunisia
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-5xl lg:text-7xl text-white tracking-tight leading-[1.05] uppercase mb-8">
              {WORDS.map((word, i) => (
                <span key={i} className="block overflow-hidden">
                  <span
                    ref={el => { if (el) wordsRef.current[i] = el }}
                    className={`block ${i === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-ast-light via-sky-300 to-white' : ''}`}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-xl font-body">
              Hire vetted Tunisian developers, designers, and specialists — with escrow-protected payments on every project.
            </p>

            {/* Interactive Floating Search Bar */}
            <div className="relative mb-8 max-w-lg">
              <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl focus-within:border-ast-light transition-all">
                <Search size={20} className="text-white/50 ml-3 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search 'Next.js App', 'Figma Design', 'AI Bot'..."
                  className="w-full bg-transparent text-white placeholder-white/40 text-sm outline-none px-2 py-2 font-body"
                />
                <Link
                  href={`/explore${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''}`}
                  className="bg-ast-light text-ast-dark px-6 py-3 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-white transition-all shadow-md shrink-0"
                >
                  Search <ArrowRight size={14} />
                </Link>
              </div>

              {/* Quick Tags */}
              <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
                <span className="font-semibold text-white/80">Trending:</span>
                {['Next.js 14', 'Figma UI', 'Python AI', 'Mobile App'].map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/explore?category=${encodeURIComponent(tag)}`}
                    className="hover:text-ast-light transition-colors underline underline-offset-2"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/explore"
                className="font-bold bg-ast-light text-ast-dark rounded-2xl px-8 py-4 shadow-xl shadow-ast-light/10 transition-transform hover:-translate-y-1 hover:bg-white flex items-center gap-2"
              >
                Explore Microjobs <ArrowRight size={16} />
              </Link>
              <Link
                href="/post-job"
                className="font-semibold border border-white/20 bg-white/10 text-white rounded-2xl px-8 py-4 backdrop-blur-md transition-transform hover:-translate-y-1 hover:bg-white/20"
              >
                Post Job (Client)
              </Link>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Escrow-Protected',
                  desc: 'Funds held securely until work is approved',
                  icon: ShieldCheck,
                },
                {
                  title: 'KYC-Verified Talent',
                  desc: 'Every freelancer identity-checked before they can bid',
                  icon: Sparkles,
                },
                {
                  title: 'Local & Fast',
                  desc: 'TND payments, built for how Tunisian freelancers and clients actually work',
                  icon: ArrowRight,
                },
                {
                  title: 'Tunisia First',
                  desc: 'Starting local, expanding across MENA',
                  icon: Sparkles,
                },
              ].map((feat, i) => (
                <Tilt3DCard key={i} className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-md shadow-lg hover:border-ast-light/40 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ast-light/15 border border-ast-light/30 flex items-center justify-center text-ast-light shrink-0 mt-0.5">
                      <feat.icon size={16} />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-white">{feat.title}</p>
                      <p className="text-white/60 text-xs mt-0.5 leading-relaxed font-body">{feat.desc}</p>
                    </div>
                  </div>
                </Tilt3DCard>
              ))}
            </div>
          </div>

          {/* Right Column 3D Hologram Graphic */}
          <div className="flex flex-1 w-full max-w-lg h-[360px] sm:h-[420px] lg:h-[480px] items-center justify-center relative">
            <LogoModel />
          </div>
        </div>

        {/* Scroll Indicator */}
        {showScroll && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce text-ast-light/60 flex flex-col items-center gap-1 pointer-events-none">
            <span className="font-mono text-[10px] tracking-widest uppercase">Explore Platform</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path d="M8 4 L8 20 M2 14 L8 20 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </section>
    </>
  )
}
