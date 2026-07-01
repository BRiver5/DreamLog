export * from "./colors";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  pill: 999,
  button: 12,
  card: 20,
  cardLg: 24,
} as const;

/** Font family names loaded via expo-font in app/_layout.tsx. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 32, color: "#F5F3FA" },
  h2: { fontFamily: fonts.semibold, fontSize: 24, color: "#F5F3FA" },
  h3: { fontFamily: fonts.semibold, fontSize: 20, color: "#F5F3FA" },
  body: { fontFamily: fonts.regular, fontSize: 15, color: "#F5F3FA" },
  bodyMuted: { fontFamily: fonts.regular, fontSize: 14, color: "#A9A3C2" },
  label: { fontFamily: fonts.medium, fontSize: 13, color: "#A9A3C2" },
  statNumber: { fontFamily: fonts.bold, fontSize: 34, color: "#F5F3FA" },
} as const;
