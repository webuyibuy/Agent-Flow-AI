"use client"

import type React from "react"
import { motion } from "framer-motion"

interface AppleBadgeProps {
  children: React.ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "neutral" | "outline"
  size?: "sm" | "md" | "lg"
  className?: string
  dot?: boolean
  pulse?: boolean
}

export default function AppleBadge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
  pulse = false,
}: AppleBadgeProps) {
  // Apple's precise variants
  const variants = {
    default: "bg-[#8E8E93]/10 text-[#8E8E93]",
    primary: "bg-[#0369A1]/10 text-[#0369A1]",
    success: "bg-[#34C759]/10 text-[#34C759]",
    warning: "bg-[#FF9500]/10 text-[#FF9500]",
    danger: "bg-[#FF3B30]/10 text-[#FF3B30]",
    neutral: "bg-[#F2F2F7] text-[#3A3A3C]",
    outline: "bg-transparent border border-[#D1D1D6] text-[#8E8E93]",
  }

  // Apple's precise sizes
  const sizes = {
    sm: "text-xs px-1.5 py-0.5 rounded",
    md: "text-xs px-2 py-0.5 rounded-md",
    lg: "text-sm px-2.5 py-1 rounded-md",
  }

  // Dot colors
  const dotColors = {
    default: "bg-[#8E8E93]",
    primary: "bg-[#0369A1]",
    success: "bg-[#34C759]",
    warning: "bg-[#FF9500]",
    danger: "bg-[#FF3B30]",
    neutral: "bg-[#3A3A3C]",
    outline: "bg-[#8E8E93]",
  }

  return (
    <span className={`inline-flex items-center font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && (
        <span className="relative mr-1.5 flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColors[variant]}`} />
          {pulse && (
            <motion.span
              className={`absolute inline-flex h-full w-full rounded-full ${dotColors[variant]} opacity-75`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          )}
        </span>
      )}
      {children}
    </span>
  )
}
