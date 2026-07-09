import type { ExperienceTypeKey } from "@/services/host/types";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "confirmed"
  | "expired_unpaid"
  | "cancelled_member"
  | "cancelled_host"
  | "active"
  | "completed";

export type Slot = {
  start: string; // "HH:mm"
  end: string;
  available: boolean;
  reason?: "unavailable" | "booked";
};

export type SlotsResponse = {
  date: string;
  hostUid: string;
  minMinutes: number;
  maxMinutes: number;
  slots: Slot[];
  availableCount: number;
};

export type Venue = {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
};

export type Booking = {
  bookingId: string;
  memberUid: string;
  hostUid: string;
  hostSnapshot: { displayName: string; professionalRole?: string; photoUrl?: string | null };
  memberSnapshot: { displayName: string; photoUrl?: string | null };
  category?: ExperienceTypeKey | null;
  venue: Venue;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  hourlyRateSnapshot: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: BookingStatus;
  paymentIntentId?: string;
  paymentDueAt?: string;
  cancelReason?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingPayload = {
  hostUid: string;
  startAt: string;
  durationMinutes: number;
  category?: ExperienceTypeKey;
  venue: Venue;
};

export type BookingWindow = "current" | "upcoming" | "past";
