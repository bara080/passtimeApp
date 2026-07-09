import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "passtime_themePreference";

function apply(pref: ThemePreference): void {
  // null restores the OS-driven scheme; a value overrides it app-wide.
  Appearance.setColorScheme(pref === "system" ? null : pref);
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export async function setThemePreference(pref: ThemePreference): Promise<void> {
  apply(pref);
  await AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
}

/** Call once at app start so a saved override survives restarts. */
export async function applySavedThemePreference(): Promise<void> {
  apply(await loadThemePreference());
}
