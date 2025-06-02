// Apple Design System 2025 - Enhanced Color Palette with Light Theme Focus
export const appleColors = {
  // Primary colors - optimized for light theme
  primary: {
    light: "#0071e3", // Apple blue
    DEFAULT: "#0066cc", // Apple blue (slightly darker)
    dark: "#0055b3", // Apple blue (darker)
    hover: "#0077ED", // Hover state
    active: "#005CC8", // Active state
  },

  // Light theme optimized neutral colors
  neutral: {
    50: "#ffffff", // Pure white
    100: "#f9f9f9", // Almost white
    200: "#f2f2f7", // Light background
    300: "#e5e5ea", // Light dividers
    400: "#d1d1d6", // Medium dividers
    500: "#c7c7cc", // Medium-dark dividers
    600: "#aeaeb2", // Medium text
    700: "#8e8e93", // Medium-dark text
    800: "#636366", // Dark text
    900: "#3a3a3c", // Very dark text
    950: "#1c1c1e", // Almost black
  },

  // Semantic colors - light theme optimized
  success: {
    light: "#34c759", // Success light
    DEFAULT: "#28a745", // Success default (darker for better contrast)
    dark: "#1e7e34", // Success dark
    bg: "#d4edda", // Light success background
    text: "#155724", // Dark success text
  },
  warning: {
    light: "#ff9f0a", // Warning light
    DEFAULT: "#ffc107", // Warning default
    dark: "#e0a800", // Warning dark
    bg: "#fff3cd", // Light warning background
    text: "#856404", // Dark warning text
  },
  error: {
    light: "#ff3b30", // Error light
    DEFAULT: "#dc3545", // Error default (better contrast)
    dark: "#c82333", // Error dark
    bg: "#f8d7da", // Light error background
    text: "#721c24", // Dark error text
  },
  info: {
    light: "#5ac8fa", // Info light
    DEFAULT: "#17a2b8", // Info default (better contrast)
    dark: "#138496", // Info dark
    bg: "#d1ecf1", // Light info background
    text: "#0c5460", // Dark info text
  },

  // Special colors
  accent1: "#bf5af2", // Purple accent
  accent2: "#ff2d55", // Pink accent
  accent3: "#5e5ce6", // Indigo accent

  // Light theme focused background colors
  background: {
    primary: "#ffffff", // Primary background (white)
    secondary: "#f9f9f9", // Secondary background (very light gray)
    tertiary: "#f2f2f7", // Tertiary background (light gray)
    elevated: "#ffffff", // Elevated background (white with shadow)
    card: "#ffffff", // Card background
    muted: "#f8f9fa", // Muted background
    dark: {
      primary: "#1c1c1e", // Dark primary background
      secondary: "#2c2c2e", // Dark secondary background
      tertiary: "#3a3a3c", // Dark tertiary background
      elevated: "#2c2c2e", // Dark elevated background
      card: "#2c2c2e", // Dark card background
      muted: "#3a3a3c", // Dark muted background
    },
  },

  // Text colors optimized for light theme
  text: {
    primary: "#1c1c1e", // Primary text (dark)
    secondary: "#636366", // Secondary text (medium)
    tertiary: "#8e8e93", // Tertiary text (light)
    muted: "#aeaeb2", // Muted text
    inverse: "#ffffff", // Inverse text (white)
    dark: {
      primary: "#ffffff", // Dark mode primary text
      secondary: "#aeaeb2", // Dark mode secondary text
      tertiary: "#8e8e93", // Dark mode tertiary text
      muted: "#636366", // Dark mode muted text
      inverse: "#1c1c1e", // Dark mode inverse text
    },
  },

  // Border colors for light theme
  border: {
    light: "#e5e5ea", // Light border
    DEFAULT: "#d1d1d6", // Default border
    dark: "#c7c7cc", // Dark border
    muted: "#f2f2f7", // Muted border
    dark_theme: {
      light: "#3a3a3c", // Dark theme light border
      DEFAULT: "#48484a", // Dark theme default border
      dark: "#636366", // Dark theme dark border
      muted: "#2c2c2e", // Dark theme muted border
    },
  },

  // Special UI elements
  glass: {
    light: "rgba(255, 255, 255, 0.8)",
    dark: "rgba(30, 30, 30, 0.7)",
  },

  // Gradient colors
  gradient: {
    blue: ["#0091ff", "#0066cc"],
    purple: ["#bf5af2", "#9851e0"],
    orange: ["#ff9f0a", "#ff7d0a"],
    light: ["#ffffff", "#f9f9f9"],
    dark: ["#2c2c2e", "#1c1c1e"],
  },
}

// Enhanced typography for better light theme readability
export const appleTypography = {
  fontFamily: {
    sans: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: "SF Mono, SFMono-Regular, ui-monospace, monospace",
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
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
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
}

// Enhanced spacing system
export const appleSpacing = {
  0: "0",
  px: "1px",
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
  36: "9rem", // 144px
  40: "10rem", // 160px
  44: "11rem", // 176px
  48: "12rem", // 192px
  52: "13rem", // 208px
  56: "14rem", // 224px
  60: "15rem", // 240px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem", // 384px
}

// Enhanced shadows for light theme
export const appleShadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  // Apple-specific shadows for light theme
  elevated: "0 8px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.03)",
  card: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.02)",
  button: "0 1px 2px rgba(0, 0, 0, 0.05)",
  focus: "0 0 0 4px rgba(0, 125, 250, 0.3)",
  none: "none",
  // Dark theme shadows
  dark: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
  },
}

// Enhanced border radius
export const appleBorderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  DEFAULT: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.75rem", // 28px
  full: "9999px",
  // Apple-specific
  button: "0.75rem", // 12px
  card: "1rem", // 16px
  modal: "1.25rem", // 20px
  pill: "9999px",
}

// Enhanced transitions
export const appleTransitions = {
  duration: {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    400: "400ms",
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },
  timing: {
    DEFAULT: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    // Apple-specific
    spring: "cubic-bezier(0.25, 0.1, 0.25, 1.05)",
    bounce: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
}

// Z-Index system
export const appleZIndex = {
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",
  auto: "auto",
  // Apple-specific
  base: "1",
  dropdown: "1000",
  sticky: "1100",
  fixed: "1200",
  modal: "1300",
  popover: "1400",
  tooltip: "1500",
  toast: "1600",
}
