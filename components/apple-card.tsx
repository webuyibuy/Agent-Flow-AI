"use client"

import type React from "react"
import { forwardRef } from "react"
import { motion, type MotionProps } from "framer-motion"

interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement>, MotionProps {
  children: React.ReactNode
  className?: string
  variant?: "elevated" | "flat" | "glass" | "subtle"
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  hover?: boolean
  interactive?: boolean
  borderRadius?: "sm" | "md" | "lg" | "xl"
}

const AppleCard = forwardRef<HTMLDivElement, AppleCardProps>(
  (
    {
      children,
      className = "",
      variant = "elevated",
      padding = "md",
      hover = false,
      interactive = false,
      borderRadius = "lg",
      ...props
    },
    ref,
  ) => {
    // Base classes with Apple's precise styling
    const baseClasses = "transition-all duration-200"

    // Apple's precise variants
    const variants = {
      elevated: "bg-white border border-[#E5E5EA] shadow-sm",
      flat: "bg-[#F2F2F7] border border-[#E5E5EA]",
      glass: "bg-white/80 backdrop-blur-xl border border-[#E5E5EA]/50 shadow-sm",
      subtle: "bg-[#F9FAFB] border border-[#E5E5EA]",
    }

    // Apple's precise padding
    const paddings = {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    }

    // Apple's precise border radius
    const radii = {
      sm: "rounded-md", // 6px
      md: "rounded-lg", // 8px
      lg: "rounded-xl", // 12px
      xl: "rounded-2xl", // 16px
    }

    // Interactive props for hover effects
    const interactiveProps = interactive
      ? {
          whileHover: { y: -2, scale: 1.01, boxShadow: "0 8px 16px rgba(0,0,0,0.08)" },
          whileTap: { scale: 0.99 },
          transition: { type: "spring", stiffness: 400, damping: 17 },
        }
      : {}

    // Hover props for subtle hover effects
    const hoverProps =
      hover && !interactive
        ? {
            whileHover: { y: -2, boxShadow: "0 8px 16px rgba(0,0,0,0.08)" },
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }
        : {}

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${radii[borderRadius]} ${className}`}
        {...interactiveProps}
        {...hoverProps}
        {...props}
      >
        {children}
      </motion.div>
    )
  },
)

AppleCard.displayName = "AppleCard"

export default AppleCard
