import { useColorScheme } from "react-native";
import { colors, darkColors } from "@/constants/theme";

/** Palette for the current system color scheme. Pair with NativeWind `dark:` variants. */
export function useThemeColors() {
  const scheme = useColorScheme();
  return { palette: scheme === "dark" ? darkColors : colors, isDark: scheme === "dark" };
}
