'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { testimonials } from '@/lib/data/testimonials'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function TestimonialsSection() {
  const [active, setActive] = useState(0)

  const next = useCallback(() => setActive(a => (a + 1) % testimonials.length), [])
  const prev = useCallback(() => setActive(a => (a - 1 + testimonials.length) % testimonials.length), [])

  useEffect(() => {
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next])

  const t = testimonials[active]

  return (
    <section className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-3">Testimonials</p>
        <h2 className="font-heading font-bold text-4xl lg:text-5xl text-black mb-16">What Clients Say</h2>

        <div className="relative min-h-48">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <blockquote className="text-xl lg:text-2xl text-black/80 leading-relaxed font-light mb-8 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-lg">
                  {t.initials}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-black">{t.authorName}</p>
                  <p className="text-ast-gray text-sm">{t.authorRole}, {t.authorCompany}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center hover:border-ast-primary hover:text-ast-primary transition-colors" aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-ast-primary w-6' : 'bg-black/20'}`} aria-label={`Go to ${i + 1}`} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center hover:border-ast-primary hover:text-ast-primary transition-colors" aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
