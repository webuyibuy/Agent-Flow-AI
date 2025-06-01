"use client"

import type React from "react"
import { forwardRef } from "react"
import { motion } from "framer-motion"

interface AppleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
}

const AppleInput = forwardRef<HTMLInputElement, AppleInputProps>(
  ({ label, error, icon, rightElement, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 w-5 h-5">{icon}</span>
            </div>
          )}

          <motion.input
            ref={ref}
            className={`
            block w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200
            focus:border-blue-500 focus:ring-blue-500 focus:ring-1
            placeholder:text-gray-400
            ${icon ? "pl-10" : "pl-3"}
            ${rightElement ? "pr-10" : "pr-3"}
            ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            {...props}
          />

          {rightElement && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>}
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-600">
            {error}
          </motion.p>
        )}
      </div>
    )
  },
)

AppleInput.displayName = "AppleInput"

export default AppleInput
