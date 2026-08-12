export type UserRole = "member" | "host";

export type AuthUser = {
  uid: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: string;
  hostOnboardingStep?: string | null;
  hostOnboardingComplete?: boolean;
  /** 3-letter ISO currency code, e.g. "usd". */
  currency?: string;
  /** Display country name, e.g. "United States". */
  country?: string | null;
  identityStatus?: "unverified" | "pending" | "verified" | "rejected";
};

export type LoginPayload = {
  email: string;
  password: string;
  role: UserRole;
  deviceInfo?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  deviceInfo?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  /** ISO date string, e.g. "1995-06-15" */
  dateOfBirth?: string;
  /** Public https URL from the media pipeline. Null clears the avatar. */
  avatarUrl?: string | null;
  /** 3-letter ISO currency code, e.g. "usd". */
  currency?: string;
  /** Display country name, e.g. "United States". */
  country?: string;
};

export type SocialLoginPayload = {
  /** Raw provider token: Google idToken or Apple identityToken. */
  idToken: string;
  provider: "google" | "apple";
  role: UserRole;
  deviceInfo?: string;
};
