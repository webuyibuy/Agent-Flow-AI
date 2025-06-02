import type React from "react"
export const metadata = {
  title: "Minimal Next.js App",
  description: "A minimal Next.js application",
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