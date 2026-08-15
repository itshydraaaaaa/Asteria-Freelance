'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  className?: string
}

export function Tilt3DCard({ children, className = '' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const rX = ((mouseY - height / 2) / (height / 2)) * -10
    const rY = ((mouseX - width / 2) / (width / 2)) * 10

    setRotateX(rX)
    setRotateY(rY)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}
