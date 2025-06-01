"use client"

import type React from "react"
import { motion } from "framer-motion"

interface AppleCardProps {
  children: React.ReactNode
  className?: string
  variant?: "elevated" | "flat" | "glass"
  padding?: "none" | "sm" | "md" | "lg"
  hover?: boolean
}

export default function AppleCard({
  children,
  className = "",
  variant = "elevated",
  padding = "md",
  hover = false,
}: AppleCardProps) {
  const baseClasses = "rounded-xl border transition-all duration-200"

  const variants = {
    elevated: "bg-white border-gray-200 shadow-sm hover:shadow-md",
    flat: "bg-gray-50 border-gray-200",
    glass: "bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-sm",
  }

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  const hoverProps = hover
    ? {
        whileHover: { y: -2, scale: 1.01 },
        transition: { type: "spring", stiffness: 300, damping: 30 },
      }
    : {}

  return (
    <motion.div className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`} {...hoverProps}>
      {children}
    </motion.div>
  )
}
