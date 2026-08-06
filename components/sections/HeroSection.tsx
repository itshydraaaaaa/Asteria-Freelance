'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import gsap from 'gsap'
import { LoadingScreen } from '@/components/loading/LoadingScreen'

const HeroCanvas = dynamic(() => import('@/components/3d/HeroCanvas'), { ssr: false })
const LogoModel  = dynamic(() => import('@/components/3d/LogoModel'),  { ssr: false })

const STATS = [
  { value: 12400,   label: 'Active Freelancers', suffix: '+' },
  { value: 98,      label: 'Client Satisfaction', suffix: '%' },
  { value: 48,      label: 'Avg Delivery Hours', suffix: 'h' },
  { value: 2400000, label: 'Paid Out', prefix: '$', compact: true },
]

function formatCompact(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000)    return (v / 1000).toFixed(0) + 'K'
  return String(v)
}

export function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const [showScroll, setShowScroll] = useState(true)
  const wordsRef = useRef<HTMLSpanElement[]>([])
  const statRefs = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY < 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(wordsRef.current, {
        yPercent: 110, opacity: 0, duration: 0.8,
        stagger: 0.1, ease: 'power4.out', delay: 0.2,
      })
      STATS.forEach((s, i) => {
        const el = statRefs.current[i]
        if (!el) return
        gsap.to({ val: 0 }, {
          val: s.value, duration: 2, delay: 0.8,
          ease: 'power2.out', snap: { val: 1 },
          onUpdate() {
            const v = (this.targets()[0] as any).val
            el.textContent = s.compact ? formatCompact(v) : String(Math.round(v))
          },
        })
      })
    })
    return () => mm.revert()
  }, [loaded])

  const WORDS = ['FIND', 'ELITE', 'FREELANCE', 'TALENT']

  const handleComplete = () => setLoaded(true)

  return (
    <>
      {!loaded && <LoadingScreen onComplete={handleComplete} />}

      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <div className="absolute inset-0 z-0 bg-ast-dark">
          <HeroCanvas />
        </div>

        <div className="absolute inset-0 z-10 bg-gradient-to-r from-ast-dark/95 via-ast-dark/80 to-transparent" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full flex flex-col lg:flex-row items-center gap-12 py-32">
          <div className="flex-1 max-w-2xl">
            <p className="font-mono text-ast-light text-[11px] tracking-[0.3em] mb-8 uppercase">
              Asteria Freelance — 2026
            </p>

            <h1 className="font-heading font-bold text-6xl lg:text-7xl text-white tracking-wider leading-none uppercase mb-8">
              {WORDS.map((word, i) => (
                <span key={i} className="block overflow-hidden">
                  <span
                    ref={el => { if (el) wordsRef.current[i] = el }}
                    className="block"
                    style={{ display: 'block' }}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              Connect with verified independent professionals across the MENA region.
              Elite talent, escrow protection, results guaranteed.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <Link
                href="/explore"
                className="font-medium bg-black text-white rounded-full px-8 py-4 hover:bg-ast-primary transition-colors"
              >
                Start Hiring
              </Link>
              <Link
                href="/freelancers"
                className="font-medium border border-ast-light text-ast-light rounded-full px-8 py-4 hover:bg-ast-light hover:text-ast-dark transition-colors"
              >
                Find Work
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {STATS.map((s, i) => (
                <div key={i}>
                  <p className="font-heading font-bold text-2xl text-ast-light">
                    {s.prefix}
                    <span
                      ref={el => { if (el) statRefs.current[i] = el }}
                      className="stat-num"
                    >
                      {s.compact ? '0' : '0'}
                    </span>
                    {s.suffix}
                  </p>
                  <p className="text-white/50 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md h-96 items-center justify-center">
            <div className="w-full h-full">
              <LogoModel />
            </div>
          </div>
        </div>

        {showScroll && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce text-ast-light/60 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] tracking-widest2">SCROLL</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path d="M8 4 L8 20 M2 14 L8 20 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </section>
    </>
  )
}
