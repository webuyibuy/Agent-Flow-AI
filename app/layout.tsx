import type React from "react"
import "./globals.css"

export const metadata = {
  title: "AgentFlow Platform",
  description: "AI Agent Management Platform",
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
