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
};
