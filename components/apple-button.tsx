"use client"

import type React from "react"
import { forwardRef } from "react"
import { motion } from "framer-motion"
import { Loader2Icon } from "lucide-react"

interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
  children: React.ReactNode
}

const AppleButton = forwardRef<HTMLButtonElement, AppleButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    // Base classes with Apple's precise styling
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

    // Apple's precise variants
    const variants = {
      primary:
        "bg-[#0369A1] text-white hover:bg-[#075985] focus-visible:ring-[#0369A1] shadow-sm hover:shadow active:scale-[0.98]",
      secondary:
        "bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA] focus-visible:ring-[#8E8E93] border border-[#E5E5EA] hover:border-[#D1D1D6]",
      ghost: "text-[#3A3A3C] hover:bg-[#F2F2F7] focus-visible:ring-[#8E8E93] hover:text-[#1C1C1E]",
      destructive:
        "bg-[#FF3B30] text-white hover:bg-[#FF453A] focus-visible:ring-[#FF3B30] shadow-sm hover:shadow active:scale-[0.98]",
      outline: "bg-transparent text-[#0369A1] border border-[#0369A1] hover:bg-[#F0F7FF] focus-visible:ring-[#0369A1]",
    }

    // Apple's precise sizes
    const sizes = {
      xs: "px-2 py-1 text-xs gap-1.5 rounded",
      sm: "px-2.5 py-1.5 text-sm gap-1.5",
      md: "px-3.5 py-2 text-sm gap-2",
      lg: "px-4 py-2.5 text-base gap-2",
      xl: "px-5 py-3 text-base gap-2.5",
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2Icon className="w-4 h-4 animate-spin" />
        ) : icon && iconPosition === "left" ? (
          <span className="flex items-center justify-center">{icon}</span>
        ) : null}

        <span className={loading ? "opacity-0" : ""}>{children}</span>

        {icon && iconPosition === "right" && !loading ? (
          <span className="flex items-center justify-center">{icon}</span>
        ) : null}
      </motion.button>
    )
  },
)

AppleButton.displayName = "AppleButton"

export default AppleButton
