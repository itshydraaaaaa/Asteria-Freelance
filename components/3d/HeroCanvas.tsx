'use client'

/**
 * components/3d/HeroCanvas.tsx — 3D Particle & Wave Grid Engine
 *
 * NOTE on RTL / Localization:
 * Mouse-parallax and particle 3D projection math are cursor-relative and
 * depth-relative, not text-direction-relative. They must NOT be flipped in RTL.
 *
 * Accessibility & Performance (Phase 9):
 * - aria-hidden="true" applied (decorative canvas, semantic text lives in HeroSection)
 * - Detects prefers-reduced-motion: reduce and renders static fallback
 * - Detects mobile hardware/viewport (<768px) and reduces particle count (45 vs 180) + caps frame rate to 30fps
 */

import { useEffect, useRef, useState } from 'react'

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setReducedMotion(true)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width  = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Mobile performance detection
    const isMobile = width < 768 || (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 4)
    const PARTICLE_COUNT = isMobile ? 45 : 180
    const TARGET_FPS = isMobile ? 30 : 60
    const FRAME_INTERVAL = 1000 / TARGET_FPS
    let lastFrameTime = performance.now()

    // Mouse interactive coordinates
    let mouseX = width / 2
    let mouseY = height / 2
    let targetMouseX = width / 2
    let targetMouseY = height / 2

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseX = e.clientX - rect.left
      targetMouseY = e.clientY - rect.top
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // 3D Particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 800 + 1,
      r: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.7 + 0.3,
      speedZ: Math.random() * 0.8 + 0.4,
      hue: 180 + Math.random() * 40,
    }))

    const focalLength = 400

    function render(now: number) {
      if (!ctx) return

      const elapsed = now - lastFrameTime
      if (elapsed < FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(render)
        return
      }
      lastFrameTime = now - (elapsed % FRAME_INTERVAL)

      ctx.clearRect(0, 0, width, height)

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      const centerX = width / 2
      const centerY = height / 2

      // Render 3D Perspective Wave Grid Floor
      ctx.save()
      ctx.strokeStyle = 'rgba(96, 200, 212, 0.08)'
      ctx.lineWidth = 1

      const gridY = height * 0.65
      for (let z = 100; z < 900; z += isMobile ? 80 : 50) {
        const perspectiveScale = focalLength / z
        const y = gridY + (z - 100) * 0.35 * perspectiveScale
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      const gridStep = isMobile ? 100 : 60
      for (let x = -width; x < width * 2; x += gridStep) {
        ctx.beginPath()
        ctx.moveTo(x, gridY)
        ctx.lineTo(centerX + (x - centerX) * 3, height)
        ctx.stroke()
      }
      ctx.restore()

      // Render 3D Particle Constellation Engine
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.z -= p.speedZ
        if (p.z <= 1) {
          p.z = 800
          p.x = (Math.random() - 0.5) * width * 1.5
          p.y = (Math.random() - 0.5) * height * 1.5
        }

        const scale = focalLength / p.z
        const projX = (p.x + (mouseX - centerX) * 0.1) * scale + centerX
        const projY = (p.y + (mouseY - centerY) * 0.1) * scale + centerY
        const projRadius = Math.max(0.5, p.r * scale * 0.8)

        if (projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.beginPath()
          ctx.arc(projX, projY, projRadius, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.baseAlpha * Math.min(1, scale)})`
          if (!isMobile) {
            ctx.shadowBlur = 10
            ctx.shadowColor = `hsla(${p.hue}, 80%, 65%, 0.8)`
          }
          ctx.fill()
          if (!isMobile) {
            ctx.shadowBlur = 0
          }

          // Constellation connection lines (only check a subset for performance)
          const connectionStep = isMobile ? 10 : 6
          for (let j = i + 1; j < particles.length; j += connectionStep) {
            const p2 = particles[j]
            const scale2 = focalLength / p2.z
            const projX2 = (p2.x + (mouseX - centerX) * 0.1) * scale2 + centerX
            const projY2 = (p2.y + (mouseY - centerY) * 0.1) * scale2 + centerY

            const distSq = (projX - projX2) ** 2 + (projY - projY2) ** 2
            if (distSq < 100 * 100) {
              const alpha = (1 - Math.sqrt(distSq) / 100) * 0.15 * scale
              ctx.beginPath()
              ctx.moveTo(projX, projY)
              ctx.lineTo(projX2, projY2)
              ctx.strokeStyle = `rgba(96, 200, 212, ${alpha})`
              ctx.lineWidth = 0.8
              ctx.stroke()
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(render)
    }

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }

    window.addEventListener('resize', handleResize, { passive: true })
    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (reducedMotion) {
    // Static designed fallback for prefers-reduced-motion
    return (
      <div
        aria-hidden="true"
        className="w-full h-full bg-gradient-to-b from-[#0a3a40]/30 via-transparent to-[#0a3a40]/80 pointer-events-none"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full h-full block bg-transparent pointer-events-none"
    />
  )
}
