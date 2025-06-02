import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles - Apple-inspired clean design
        "flex w-full rounded-xl border bg-white px-4 py-3 text-base",
        // Border and background
        "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
        // Text colors
        "text-gray-900 dark:text-white",
        // Placeholder
        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
        // Focus states - Apple blue
        "focus:border-blue-500 dark:focus:border-blue-400",
        "focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
        "focus:outline-none",
        // Transitions
        "transition-all duration-200",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
