import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AgentFlow - AI Agent Management Platform",
  description: "Create, manage, and optimize your AI agents with AgentFlow's intuitive platform",
  keywords: ["AI", "agents", "automation", "management", "productivity"],
  authors: [{ name: "AgentFlow Team" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
