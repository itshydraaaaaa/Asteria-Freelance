'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function StepConnector() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!pathRef.current) return
    const len = pathRef.current.getTotalLength()
    gsap.set(pathRef.current, { strokeDasharray: len, strokeDashoffset: len })
    gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#how-it-works',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: true,
      },
    })
  }, [])

  return (
    <svg
      className="absolute left-1/2 top-0 -translate-x-1/2 hidden lg:block pointer-events-none"
      width="2" height="100%"
      style={{ height: '100%' }}
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M1 0 L1 10000"
        stroke="#60c8d4"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />
    </svg>
  )
}
