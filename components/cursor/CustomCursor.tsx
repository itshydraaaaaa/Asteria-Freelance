'use client'
import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (navigator.maxTouchPoints > 0) return

    document.documentElement.classList.add('cursor-none')

    let rx = 0, ry = 0
    let mx = 0, my = 0

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    let rafId: number
    const tick = () => {
      rx = lerp(rx, mx, 0.1)
      ry = lerp(ry, my, 0.1)
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || !ringRef.current) return
      const interactive = target.closest('a, button, [data-cursor="hover"]')
      if (interactive) {
        ringRef.current.style.width  = '56px'
        ringRef.current.style.height = '56px'
        ringRef.current.style.opacity = '0.5'
        ringRef.current.style.mixBlendMode = 'difference'
      } else {
        ringRef.current.style.width  = '36px'
        ringRef.current.style.height = '36px'
        ringRef.current.style.opacity = '1'
        ringRef.current.style.mixBlendMode = 'normal'
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      cancelAnimationFrame(rafId)
      document.documentElement.classList.remove('cursor-none')
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-ast-light"
        style={{ transition: 'none' }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-9 h-9 rounded-full border-[1.5px] border-ast-light"
        style={{ transition: 'width 0.2s, height 0.2s, opacity 0.2s' }}
      />
    </>
  )
}
