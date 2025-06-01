"use client"

import type React from "react"
import { Card } from "./card"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon: React.ReactNode
  description?: string
}

export function StatCard({ title, value, change, trend = "neutral", icon, description }: StatCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  }

  const iconBgColors = {
    up: "bg-green-100",
    down: "bg-red-100",
    neutral: "bg-blue-100",
  }

  const iconColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-blue-600",
  }

  return (
    <Card hover>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg ${iconBgColors[trend]}`}>
            <div className={`w-6 h-6 ${iconColors[trend]}`}>{icon}</div>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-3xl font-bold text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      {(change || description) && (
        <div className="mt-4">
          {change && (
            <div className="flex items-center text-sm">
              <span className={`font-medium ${trendColors[trend]}`}>{change}</span>
              <span className="ml-1 text-gray-500">from last week</span>
            </div>
          )}
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      )}
    </Card>
  )
}
