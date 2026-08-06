'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef      = useRef<SVGSVGElement>(null)
  const lettersRef   = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem('ast-loaded')
    const skip = new URLSearchParams(window.location.search).get('skip')
    if (seen || skip) { onComplete(); return }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('ast-loaded', '1')
        onComplete()
      },
    })

    tl.fromTo(logoRef.current, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 0.2)
      .fromTo(
        logoRef.current?.querySelectorAll('path') ?? [],
        { strokeDashoffset: 1000 },
        { strokeDashoffset: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
        0.8
      )
      .fromTo(
        lettersRef.current,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' },
        1.4
      )
      .to(containerRef.current, { y: '-100vh', duration: 0.7, ease: 'power4.inOut' }, 2.0)
  }, [onComplete])

  const letters = 'STERIA'.split('')

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-ast-dark flex flex-col items-center justify-center"
    >
      <svg
        ref={logoRef}
        width="64" height="64" viewBox="0 0 64 64" fill="none"
        className="mb-6"
        style={{ opacity: 0 }}
      >
        <path
          d="M32 4 L60 56 L4 56 Z"
          stroke="#60c8d4" strokeWidth="2.5" fill="none"
          strokeDasharray="200" strokeDashoffset="200"
        />
        <path
          d="M32 20 L48 52 L16 52 Z"
          stroke="#4CB4E7" strokeWidth="1.5" fill="none"
          strokeDasharray="160" strokeDashoffset="160"
        />
        <circle cx="32" cy="38" r="4" fill="#60c8d4" />
      </svg>

      <div className="flex items-center gap-0.5 overflow-hidden">
        <span className="font-heading text-3xl font-bold text-ast-light tracking-widest2">A</span>
        {letters.map((l, i) => (
          <span
            key={i}
            ref={el => { if (el) lettersRef.current[i] = el }}
            className="font-heading text-3xl font-bold text-white tracking-widest2"
            style={{ display: 'inline-block' }}
          >
            {l}
          </span>
        ))}
      </div>

      <p className="font-mono text-ast-light/60 text-xs tracking-[0.3em] mt-3">
        FREELANCE — 2026
      </p>
    </div>
  )
}
