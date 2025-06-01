"use client"

import type React from "react"
import { forwardRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XCircleIcon } from "lucide-react"

interface AppleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  containerClassName?: string
}

const AppleInput = forwardRef<HTMLInputElement, AppleInputProps>(
  (
    {
      label,
      description,
      error,
      icon,
      rightElement,
      clearable = false,
      onClear,
      className = "",
      containerClassName = "",
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [inputValue, setInputValue] = useState(value || "")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      onChange?.(e)
    }

    const handleClear = () => {
      setInputValue("")
      onClear?.()

      // Create a synthetic event to trigger onChange
      const syntheticEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>

      onChange?.(syntheticEvent)
    }

    const showClearButton = clearable && inputValue && inputValue.toString().length > 0

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">{label}</label>}

        <div className="relative">
          <motion.div
            className={`absolute inset-0 rounded-lg pointer-events-none ${
              error ? "ring-2 ring-[#FF3B30]" : isFocused ? "ring-2 ring-[#0369A1]" : ""
            }`}
            initial={false}
            animate={{
              backgroundColor: isFocused ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)",
              boxShadow: isFocused ? "0 1px 3px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
            }}
            transition={{ duration: 0.2 }}
          />

          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={`text-[#8E8E93] w-5 h-5 ${error ? "text-[#FF3B30]" : ""}`}>{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            value={inputValue}
            onChange={handleChange}
            className={`
              block w-full rounded-lg border border-[#D1D1D6] shadow-sm transition-all duration-200
              focus:border-[#0369A1] focus:ring-0
              placeholder:text-[#8E8E93]
              ${error ? "border-[#FF3B30] focus:border-[#FF3B30]" : ""}
              ${icon ? "pl-10" : "pl-3"}
              ${showClearButton || rightElement ? "pr-10" : "pr-3"}
              py-2 text-[#1C1C1E] text-sm
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Clear button or right element */}
          {(showClearButton || rightElement) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showClearButton ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[#8E8E93] hover:text-[#3A3A3C] focus:outline-none"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              ) : (
                rightElement
              )}
            </div>
          )}
        </div>

        {/* Description or error message */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-[#FF3B30]"
            >
              {error}
            </motion.p>
          ) : description ? (
            <motion.p
              key="description"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-[#8E8E93]"
            >
              {description}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  },
)

AppleInput.displayName = "AppleInput"

export default AppleInput
