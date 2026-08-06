'use client'
import { motion, useScroll, useTransform } from 'framer-motion'

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9998] pointer-events-none origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #11606e, #60c8d4, #4CB4E7)',
        transformOrigin: '0% 50%',
      }}
    />
  )
}
