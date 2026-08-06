'use client'
import { useEffect, useRef } from 'react'

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width  = canvas.offsetWidth
    let height = canvas.offsetHeight
    canvas.width  = width
    canvas.height = height

    const COUNT = 260
    const particles = Array.from({ length: COUNT }, () => ({
      x:   Math.random() * width,
      y:   Math.random() * height,
      vx:  (Math.random() - 0.5) * 0.35,
      vy:  (Math.random() - 0.5) * 0.2,
      r:   Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.6 + 0.15,
    }))

    let t = 0

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const waveCount = 3
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath()
        const amp   = 18 + w * 8
        const freq  = 0.006 - w * 0.001
        const speed = 0.0006 + w * 0.0003
        const yBase = height * (0.35 + w * 0.14)
        const alpha = 0.06 - w * 0.015
        for (let x = 0; x <= width; x += 3) {
          const y = yBase + Math.sin(x * freq + t * speed * 60) * amp
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(96,200,212,${alpha})`
        ctx.lineWidth = 1.2 - w * 0.2
        ctx.stroke()
      }

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        const hue = 185 + Math.sin(p.x * 0.01 + t * 0.0003) * 20
        ctx.fillStyle = `hsla(${hue},65%,72%,${p.alpha})`
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
      }
      t++
      animRef.current = requestAnimationFrame(draw)
    }

    const onResize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width  = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full h-full"
      style={{ display: 'block', background: 'transparent' }}
    />
  )
}
