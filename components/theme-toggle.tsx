"use client"

import { useTheme } from "@/lib/theme-manager"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {resolvedTheme === "light" ? "🌙" : "☀️"}
    </button>
  )
}

export function SimpleThemeToggle() {
  return <ThemeToggle />
}
