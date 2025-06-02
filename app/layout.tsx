import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AgentFlow",
  description: "AI-powered agent management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


import './globals.css'