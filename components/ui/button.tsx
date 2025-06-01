"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Loader2Icon } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500 shadow-sm hover:shadow-md active:scale-[0.98]",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-gray-200 hover:border-gray-300",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 hover:text-gray-900",
    destructive:
      "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 shadow-sm hover:shadow-md active:scale-[0.98]",
  }

  const sizes = {
    sm: "px-3 py-2 text-sm gap-2",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-3",
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2Icon className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex items-center justify-center w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
