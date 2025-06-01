// Apple Design System 2025 - Precision Implementation
export const AppleDesign = {
  // Color System - Directly from Apple's color palette
  colors: {
    // Primary Brand Colors
    blue: {
      50: "#F0F7FF",
      100: "#E0F2FE",
      200: "#BAE6FD",
      300: "#7DD3FC",
      400: "#38BDF8",
      500: "#0284C7", // Apple's signature blue
      600: "#0369A1",
      700: "#075985",
      800: "#0C4A6E",
      900: "#082F49",
    },

    // Neutral Grays (Apple's signature)
    gray: {
      50: "#F9FAFB",
      100: "#F2F2F7", // Apple's light background
      200: "#E5E5EA", // Light borders
      300: "#D1D1D6", // Medium borders
      400: "#C7C7CC", // Disabled text
      500: "#8E8E93", // Secondary text
      600: "#6C6C70", // Primary text (light mode)
      700: "#3A3A3C", // Strong text
      800: "#2C2C2E", // Very strong text
      900: "#1C1C1E", // Apple's dark text
    },

    // Semantic Colors - Directly from Apple's UI
    success: "#34C759", // Apple's green
    warning: "#FF9500", // Apple's orange
    error: "#FF3B30", // Apple's red
    info: "#007AFF", // Apple's blue

    // Background Colors
    background: {
      primary: "#FFFFFF",
      secondary: "#F2F2F7",
      tertiary: "#FFFFFF",
      elevated: "#FFFFFF",
    },

    // Glass Effect Colors
    glass: {
      light: "rgba(255, 255, 255, 0.72)",
      medium: "rgba(255, 255, 255, 0.6)",
      dark: "rgba(0, 0, 0, 0.05)",
    },
  },

  // Typography System - Precisely matching Apple's SF Pro
  typography: {
    fontFamily: {
      display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      mono: '"SF Mono", ui-monospace, monospace',
    },

    // Apple's exact font sizes
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.8125rem", // 13px - Apple often uses 13px
      base: "0.9375rem", // 15px - Apple's base text size
      lg: "1.0625rem", // 17px - Apple's large text
      xl: "1.1875rem", // 19px
      "2xl": "1.3125rem", // 21px
      "3xl": "1.5rem", // 24px
      "4xl": "1.9375rem", // 31px
      "5xl": "2.5rem", // 40px
      "6xl": "3rem", // 48px
    },

    // Apple's font weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500, // Apple uses this a lot
      semibold: 600, // Apple uses this for buttons
      bold: 700,
      heavy: 800,
    },

    // Apple's line heights
    lineHeight: {
      tight: 1.2, // Headings
      snug: 1.33, // Apple often uses this ratio
      normal: 1.4, // Apple's standard line height
      relaxed: 1.5,
      loose: 1.7,
    },

    // Apple's letter spacing
    letterSpacing: {
      tighter: "-0.02em", // Apple often uses negative tracking for headings
      tight: "-0.01em",
      normal: "0em",
      wide: "0.01em",
      wider: "0.02em",
    },
  },

  // Spacing System - Apple's 8px grid with specific adjustments
  spacing: {
    px: "1px",
    0: "0",
    0.5: "0.125rem", // 2px
    1: "0.25rem", // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem", // 8px - Apple's base spacing unit
    3: "0.75rem", // 12px
    4: "1rem", // 16px - Apple's standard padding
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px - Apple's large padding
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },

  // Border Radius - Apple's precise radii
  borderRadius: {
    none: "0",
    xs: "0.1875rem", // 3px
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px - Apple's standard radius
    lg: "0.75rem", // 12px - Apple's large radius
    xl: "1rem", // 16px - Apple's extra large radius
    "2xl": "1.25rem", // 20px
    "3xl": "1.5rem", // 24px
    full: "9999px",

    // Apple specific
    button: "0.5rem", // 8px - Apple's button radius
    card: "0.75rem", // 12px - Apple's card radius
    modal: "1rem", // 16px - Apple's modal radius
  },

  // Shadows - Apple's signature depth
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

    // Apple specific shadows
    card: "0 2px 12px rgba(0, 0, 0, 0.08)", // Apple's card shadow
    button: "0 1px 2px rgba(0, 0, 0, 0.08)", // Apple's button shadow
    elevated: "0 8px 16px rgba(0, 0, 0, 0.12)", // Apple's elevated element shadow
    focus: "0 0 0 4px rgba(0, 125, 250, 0.2)", // Apple's focus ring
  },

  // Animation & Transitions - Apple's precise timing functions
  animation: {
    duration: {
      fastest: "100ms",
      fast: "200ms", // Apple's quick animations
      normal: "300ms", // Apple's standard animations
      slow: "400ms",
      slowest: "500ms",
    },

    easing: {
      // Apple's precise easing functions
      standard: "cubic-bezier(0.25, 0.1, 0.25, 1.0)", // Apple's standard easing
      decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1.0)", // Apple's deceleration curve
      accelerate: "cubic-bezier(0.4, 0.0, 1, 1)", // Apple's acceleration curve
      sharp: "cubic-bezier(0.4, 0.0, 0.6, 1)", // Apple's sharp curve
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Apple's spring effect
    },
  },
} as const

// Component Variants - Precisely matching Apple's UI components
export const componentVariants = {
  button: {
    primary: {
      background: AppleDesign.colors.blue[500],
      color: "#ffffff",
      hover: AppleDesign.colors.blue[600],
      active: AppleDesign.colors.blue[700],
      shadow: AppleDesign.shadows.button,
      borderRadius: AppleDesign.borderRadius.button,
      padding: `${AppleDesign.spacing[2]} ${AppleDesign.spacing[4]}`,
      fontSize: AppleDesign.typography.fontSize.base,
      fontWeight: AppleDesign.typography.fontWeight.semibold,
    },
    secondary: {
      background: AppleDesign.colors.gray[100],
      color: AppleDesign.colors.gray[900],
      hover: AppleDesign.colors.gray[200],
      active: AppleDesign.colors.gray[300],
      shadow: AppleDesign.shadows.button,
      borderRadius: AppleDesign.borderRadius.button,
      padding: `${AppleDesign.spacing[2]} ${AppleDesign.spacing[4]}`,
      fontSize: AppleDesign.typography.fontSize.base,
      fontWeight: AppleDesign.typography.fontWeight.medium,
    },
    ghost: {
      background: "transparent",
      color: AppleDesign.colors.gray[600],
      hover: AppleDesign.colors.gray[100],
      active: AppleDesign.colors.gray[200],
      borderRadius: AppleDesign.borderRadius.button,
      padding: `${AppleDesign.spacing[2]} ${AppleDesign.spacing[4]}`,
      fontSize: AppleDesign.typography.fontSize.base,
      fontWeight: AppleDesign.typography.fontWeight.medium,
    },
  },

  card: {
    elevated: {
      background: AppleDesign.colors.background.elevated,
      shadow: AppleDesign.shadows.card,
      border: `1px solid ${AppleDesign.colors.gray[200]}`,
      borderRadius: AppleDesign.borderRadius.card,
      padding: AppleDesign.spacing[6],
    },
    flat: {
      background: AppleDesign.colors.background.secondary,
      border: `1px solid ${AppleDesign.colors.gray[200]}`,
      borderRadius: AppleDesign.borderRadius.card,
      padding: AppleDesign.spacing[6],
    },
    glass: {
      background: AppleDesign.colors.glass.light,
      backdropFilter: "blur(20px)",
      border: `1px solid ${AppleDesign.colors.gray[200]}`,
      borderRadius: AppleDesign.borderRadius.card,
      padding: AppleDesign.spacing[6],
    },
  },

  input: {
    default: {
      background: AppleDesign.colors.background.primary,
      border: `1px solid ${AppleDesign.colors.gray[300]}`,
      borderRadius: AppleDesign.borderRadius.md,
      padding: `${AppleDesign.spacing[2]} ${AppleDesign.spacing[3]}`,
      fontSize: AppleDesign.typography.fontSize.base,
      shadow: AppleDesign.shadows.xs,
      focus: {
        border: `1px solid ${AppleDesign.colors.blue[500]}`,
        shadow: AppleDesign.shadows.focus,
      },
    },
  },
}
