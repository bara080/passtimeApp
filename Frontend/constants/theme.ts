export const colors = {
  accent: "#ff6633",
  accentLight: "#ff9933",
  textPrimary: "#1a1a1a",
  textSecondary: "#444444",
  textMuted: "#6b6b6b",
  border: "#d1d5dc",
  surfaceDark: "#1a1a1a",
  success: "#4caf50",
  white: "#ffffff",
} as const;

export const authGradient = [colors.accent, colors.accentLight] as const;

export const radii = {
  input: 8,
  button: 8,
} as const;
