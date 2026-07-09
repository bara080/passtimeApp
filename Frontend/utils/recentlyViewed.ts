import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "passtime_recentlyViewedHosts";
const MAX_ENTRIES = 10;

export type RecentlyViewedEntry = { uid: string; viewedAt: number };

export async function getRecentlyViewed(): Promise<RecentlyViewedEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentlyViewedEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Record a host-profile view: dedupes, most-recent-first, capped ring buffer. */
export async function addRecentlyViewed(uid: string): Promise<void> {
  try {
    const list = await getRecentlyViewed();
    const next = [{ uid, viewedAt: Date.now() }, ...list.filter((e) => e.uid !== uid)].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort — a failed write must never break navigation
  }
}

export async function clearRecentlyViewed(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
