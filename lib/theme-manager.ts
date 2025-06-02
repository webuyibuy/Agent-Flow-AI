"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from localStorage on mount
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | null
      if (savedTheme) {
        setThemeState(savedTheme)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    // Remove previous theme classes
    root.classList.remove("light", "dark")

    let resolvedThemeValue: "light" | "dark"

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      resolvedThemeValue = systemTheme
    } else {
      resolvedThemeValue = theme
    }

    // Add the resolved theme class
    root.classList.add(resolvedThemeValue)
    setResolvedTheme(resolvedThemeValue)

    // Set basic CSS custom properties
    if (resolvedThemeValue === "light") {
      root.style.setProperty("--background", "255 255 255")
      root.style.setProperty("--foreground", "0 0 0")
    } else {
      root.style.setProperty("--background", "0 0 0")
      root.style.setProperty("--foreground", "255 255 255")
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme)
    }
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>
}
