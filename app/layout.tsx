import type React from "react"

export const metadata = {
  title: "Minimal Clean App",
  description: "A completely clean Next.js application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>{children}</body>
    </html>
  )
}


import './globals.css'