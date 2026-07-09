// Types mirror Backend/api/controllers/host.js `getDashboard` response.
// All money in cents. Dates are ISO YYYY-MM-DD unless noted.

export type BankVerificationStatus = "coming_soon" | "pending" | "verified" | "action_required";

export type DashboardVerification = {
  profile: boolean;
  bank: boolean;
  bankStatus: BankVerificationStatus;
};

export type DashboardEarnings = {
  today: number;
  thisWeek: number;
  thisMonth: number;
};

export type RevenuePoint = { date: string; amount: number };

export type DashboardPerformance = {
  profileViews: number;
  bookingRequests: number;
  acceptedBookings: number;
};

export type PerformanceDay = { day: string; views: number; bookings: number };

export type AvailabilityDay = {
  date: string;
  enabled: boolean;
  /** Windows as "HH:mm-HH:mm" strings — matches the format the availability doc uses. */
  windows: string[];
};

export type HostProfileSummary = {
  /** First onboarding photo URL, used as an avatar fallback on the profile screen. */
  firstPhotoUrl: string | null;
};

export type HostDashboardResponse = {
  verification: DashboardVerification;
  pendingRequestCount: number;
  earnings: DashboardEarnings;
  revenueTrend: RevenuePoint[];
  performance: DashboardPerformance;
  performanceTrend: PerformanceDay[];
  availability: {
    thisWeek: AvailabilityDay[];
  };
  hostProfile?: HostProfileSummary;
};
