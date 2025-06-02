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
  storageKey = "agentflow-theme",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
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

    // Set CSS custom properties for theme colors
    if (resolvedThemeValue === "light") {
      root.style.setProperty("--background", "255 255 255") // white
      root.style.setProperty("--foreground", "28 28 30") // dark text
      root.style.setProperty("--card", "255 255 255") // white
      root.style.setProperty("--card-foreground", "28 28 30") // dark text
      root.style.setProperty("--popover", "255 255 255") // white
      root.style.setProperty("--popover-foreground", "28 28 30") // dark text
      root.style.setProperty("--primary", "0 102 204") // blue
      root.style.setProperty("--primary-foreground", "255 255 255") // white
      root.style.setProperty("--secondary", "249 249 249") // very light gray
      root.style.setProperty("--secondary-foreground", "28 28 30") // dark text
      root.style.setProperty("--muted", "242 242 247") // light gray
      root.style.setProperty("--muted-foreground", "142 142 147") // medium gray text
      root.style.setProperty("--accent", "242 242 247") // light gray
      root.style.setProperty("--accent-foreground", "28 28 30") // dark text
      root.style.setProperty("--destructive", "220 53 69") // red
      root.style.setProperty("--destructive-foreground", "255 255 255") // white
      root.style.setProperty("--border", "229 229 234") // light border
      root.style.setProperty("--input", "229 229 234") // light border
      root.style.setProperty("--ring", "0 125 250") // blue focus ring
    } else {
      root.style.setProperty("--background", "28 28 30") // dark
      root.style.setProperty("--foreground", "255 255 255") // white text
      root.style.setProperty("--card", "44 44 46") // dark card
      root.style.setProperty("--card-foreground", "255 255 255") // white text
      root.style.setProperty("--popover", "44 44 46") // dark
      root.style.setProperty("--popover-foreground", "255 255 255") // white text
      root.style.setProperty("--primary", "0 145 255") // lighter blue
      root.style.setProperty("--primary-foreground", "255 255 255") // white
      root.style.setProperty("--secondary", "58 58 60") // dark gray
      root.style.setProperty("--secondary-foreground", "255 255 255") // white text
      root.style.setProperty("--muted", "58 58 60") // dark gray
      root.style.setProperty("--muted-foreground", "174 174 178") // light gray text
      root.style.setProperty("--accent", "58 58 60") // dark gray
      root.style.setProperty("--accent-foreground", "255 255 255") // white text
      root.style.setProperty("--destructive", "255 69 58") // lighter red
      root.style.setProperty("--destructive-foreground", "255 255 255") // white
      root.style.setProperty("--border", "58 58 60") // dark border
      root.style.setProperty("--input", "58 58 60") // dark border
      root.style.setProperty("--ring", "90 200 250") // lighter blue focus ring
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>
}

// Hook for system theme detection
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemTheme(mediaQuery.matches ? "dark" : "light")

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return systemTheme
}
