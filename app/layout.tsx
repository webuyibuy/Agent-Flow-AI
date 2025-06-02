import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/lib/theme-manager"

export const metadata: Metadata = {
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
      <body>
        <ThemeProvider>
          <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
            <a href="/" style={{ marginRight: "1rem" }}>
              Home
            </a>
            <a href="/dashboard" style={{ marginRight: "1rem" }}>
              Dashboard
            </a>
            <a href="/login">Login</a>
          </nav>
          <main style={{ padding: "2rem" }}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'