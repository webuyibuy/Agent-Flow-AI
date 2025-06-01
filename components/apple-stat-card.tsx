"use client"

import type React from "react"
import { motion } from "framer-motion"
import AppleCard from "./apple-card"

interface AppleStatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: string | number
    direction: "up" | "down" | "neutral"
    label?: string
  }
  className?: string
}

export default function AppleStatCard({ title, value, icon, trend, className = "" }: AppleStatCardProps) {
  // Trend colors based on Apple's design
  const trendColors = {
    up: "text-[#34C759]",
    down: "text-[#FF3B30]",
    neutral: "text-[#8E8E93]",
  }

  // Icon background colors
  const iconBgColors = {
    blue: "bg-[#0369A1]/10 text-[#0369A1]",
    green: "bg-[#34C759]/10 text-[#34C759]",
    orange: "bg-[#FF9500]/10 text-[#FF9500]",
    red: "bg-[#FF3B30]/10 text-[#FF3B30]",
    purple: "bg-[#AF52DE]/10 text-[#AF52DE]",
    gray: "bg-[#8E8E93]/10 text-[#8E8E93]",
  }

  return (
    <AppleCard variant="elevated" padding="lg" hover className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#8E8E93]">{title}</h3>
          <motion.p
            className="text-3xl font-semibold text-[#1C1C1E] mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {value}
          </motion.p>

          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trendColors[trend.direction]}`}>
                {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
                {trend.value}
              </span>
              {trend.label && <span className="text-xs text-[#8E8E93] ml-1">{trend.label}</span>}
            </div>
          )}
        </div>

        {icon && (
          <motion.div
            className={`p-3 rounded-xl ${iconBgColors.blue}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </AppleCard>
  )
}
