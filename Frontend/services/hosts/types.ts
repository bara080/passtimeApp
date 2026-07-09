import type { ExperienceTypeKey } from "@/services/host/types";

/** Public-safe host card — mirrors the backend projection allowlist exactly. */
export type HostCard = {
  uid: string;
  displayName: string;
  firstName: string;
  age: number | null;
  photoUrl: string | null;
  city: string | null;
  experienceTypes: ExperienceTypeKey[];
  hourlyRate: number | null;
  currency: string;
};

export type DiscoverSection = "recommended" | "nearby";

export type DiscoverParams = {
  section: DiscoverSection;
  category?: ExperienceTypeKey;
  /** Used by "nearby" for the v1 same-city match. */
  city?: string;
  limit?: number;
  offset?: number;
};

export type DiscoverResponse = {
  section: DiscoverSection;
  hosts: HostCard[];
  offset: number;
  limit: number;
};
