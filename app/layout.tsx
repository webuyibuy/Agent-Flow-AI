import './globals.css'

export const metadata = {
  title: 'Basic Next.js App',
  description: 'A basic Next.js application',
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
