/** Light palette — mirrors Figma auth flow (node 1288-5040). */
export const colors = {
  accent: "#ff6633",
  accentLight: "#ff9933",
  textPrimary: "#1a1a1a",
  textSecondary: "#444444",
  textMuted: "#6b6b6b",
  border: "#d1d5dc",
  background: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#fafafa",
  /** High-contrast button surface (social/guest buttons): dark in light mode. */
  contrast: "#1a1a1a",
  contrastText: "#ffffff",
  placeholder: "#aaaaaa",
  surfaceDark: "#1a1a1a",
  success: "#4caf50",
  white: "#ffffff",
} as const;

export type Palette = Record<keyof typeof colors, string>;

/** Dark palette — mirrors Figma dark theme (node 1380-12684). Same keys as `colors`. */
export const darkColors: Palette = {
  accent: "#ff6633",
  accentLight: "#ff9933",
  textPrimary: "#ffffff",
  textSecondary: "#d4d4d4",
  textMuted: "#9a9a9a",
  border: "#333333",
  background: "#0d0d0d",
  surface: "#1a1a1a",
  surfaceAlt: "#1a1a1a",
  /** Inverts in dark mode: light buttons with dark text. */
  contrast: "#f4f4f5",
  contrastText: "#1a1a1a",
  placeholder: "#777777",
  surfaceDark: "#1a1a1a",
  success: "#4caf50",
  white: "#ffffff",
} as const;

export const authGradient = [colors.accent, colors.accentLight] as const;

export const radii = {
  input: 8,
  button: 8,
} as const;
