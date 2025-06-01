// Apple Design System 2025 - Complete Implementation
export const AppleDesign = {
  // Color System
  colors: {
    // Primary Brand Colors
    blue: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Primary blue
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },

    // Neutral Grays (Apple's signature)
    gray: {
      50: "#fafafa",
      100: "#f5f5f7", // Apple's light background
      200: "#e5e5ea", // Light borders
      300: "#d2d2d7", // Medium borders
      400: "#aeaeb2", // Disabled text
      500: "#8e8e93", // Secondary text
      600: "#636366", // Primary text (light mode)
      700: "#48484a", // Strong text
      800: "#3a3a3c", // Very strong text
      900: "#1d1d1f", // Apple's dark text
    },

    // Semantic Colors
    success: "#30d158",
    warning: "#ff9f0a",
    error: "#ff453a",
    info: "#64d2ff",

    // Background Colors
    background: {
      primary: "#ffffff",
      secondary: "#f5f5f7",
      tertiary: "#ffffff",
      elevated: "#ffffff",
    },

    // Glass Effect Colors
    glass: {
      light: "rgba(255, 255, 255, 0.8)",
      medium: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(0, 0, 0, 0.1)",
    },
  },

  // Typography System
  typography: {
    fontFamily: {
      display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      mono: '"SF Mono", ui-monospace, monospace',
    },

    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
      "6xl": "3.75rem", // 60px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
    },

    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing System (8px grid)
  spacing: {
    px: "1px",
    0: "0",
    0.5: "0.125rem", // 2px
    1: "0.25rem", // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem", // 8px
    2.5: "0.625rem", // 10px
    3: "0.75rem", // 12px
    3.5: "0.875rem", // 14px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    7: "1.75rem", // 28px
    8: "2rem", // 32px
    9: "2.25rem", // 36px
    10: "2.5rem", // 40px
    11: "2.75rem", // 44px
    12: "3rem", // 48px
    14: "3.5rem", // 56px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    28: "7rem", // 112px
    32: "8rem", // 128px
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.25rem", // 4px
    DEFAULT: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.75rem", // 28px
    full: "9999px",

    // Apple specific
    button: "0.75rem",
    card: "1rem",
    modal: "1.25rem",
  },

  // Shadows (Apple's signature depth)
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",

    // Apple specific shadows
    card: "0 2px 16px rgba(0, 0, 0, 0.12)",
    button: "0 1px 3px rgba(0, 0, 0, 0.12)",
    modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    focus: "0 0 0 4px rgba(14, 165, 233, 0.15)",
  },

  // Animation & Transitions
  animation: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },

    easing: {
      DEFAULT: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      linear: "linear",
      in: "cubic-bezier(0.4, 0.0, 1, 1)",
      out: "cubic-bezier(0.0, 0.0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0.0, 0.2, 1)",

      // Apple's signature easing
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },
} as const

// Component Variants
export const componentVariants = {
  button: {
    primary: {
      background: AppleDesign.colors.blue[500],
      color: "#ffffff",
      hover: AppleDesign.colors.blue[600],
      active: AppleDesign.colors.blue[700],
      shadow: AppleDesign.shadows.button,
    },
    secondary: {
      background: AppleDesign.colors.gray[100],
      color: AppleDesign.colors.gray[900],
      hover: AppleDesign.colors.gray[200],
      active: AppleDesign.colors.gray[300],
      shadow: AppleDesign.shadows.button,
    },
    ghost: {
      background: "transparent",
      color: AppleDesign.colors.gray[600],
      hover: AppleDesign.colors.gray[100],
      active: AppleDesign.colors.gray[200],
    },
  },

  card: {
    elevated: {
      background: AppleDesign.colors.background.elevated,
      shadow: AppleDesign.shadows.card,
      border: `1px solid ${AppleDesign.colors.gray[200]}`,
      borderRadius: AppleDesign.borderRadius.card,
    },
    flat: {
      background: AppleDesign.colors.background.secondary,
      border: `1px solid ${AppleDesign.colors.gray[200]}`,
      borderRadius: AppleDesign.borderRadius.card,
    },
  },
}
