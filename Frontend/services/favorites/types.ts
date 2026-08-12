import type { HostCard } from "@/services/hosts/types";

export type FavoritesResponse = { hosts: HostCard[]; count: number };

export type ToggleFavoriteResponse = { hostUid: string; favorited: boolean; count: number };
