export type ExperienceTypeKey =
  | "dinner-companion"
  | "event-partner"
  | "social-companion"
  | "fitness-companion"
  | "activity-partner"
  | "networking-companion";

export type HostLocation = {
  country: string;
  state: string;
  city: string;
  address: string;
};

export type HostOnboardingStep =
  | "experiences"
  | "rate"
  | "location"
  | "career"
  | "availability"
  | "photos"
  | "done";

/** Partial per-step payload — every field optional; the step marker drives resume. */
export type HostOnboardingPayload = {
  experienceTypes?: ExperienceTypeKey[];
  /** Cents. UI collects dollars and converts. */
  hourlyRate?: number;
  location?: HostLocation;
  professionalRole?: string;
  bio?: string;
  photos?: { path: string; url: string }[];
  step: HostOnboardingStep;
};

export type HostOnboardingResponse = {
  hostOnboardingStep: HostOnboardingStep;
  hostOnboardingComplete: boolean;
};

export type TimeRange = { start: string; end: string };

export type WeeklyDay = {
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
  enabled: boolean;
  ranges: TimeRange[];
};

export type BookingConfig = {
  minMinutes: number;
  maxMinutes: number;
  bufferMinutes: number;
};

export type AvailabilityDoc = {
  weekly: WeeklyDay[];
  blockedDates: string[];
  bookingConfig: BookingConfig;
};
