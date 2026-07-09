import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "./index";
import type { BookingWindow, CreateBookingPayload } from "./types";
import { trackEvent, trackError } from "@/utils/analytics";

const STALE_MS = 60 * 1000;

/** Server-derived hourly slots for one host on one day. */
export function useSlots(hostUid: string | null, date: string | null) {
  return useQuery({
    queryKey: ["bookings", "slots", hostUid, date],
    queryFn: () => bookingsApi.slots(hostUid!, date!),
    enabled: Boolean(hostUid && date),
    staleTime: STALE_MS,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => {
      trackEvent("booking.request.submit", { hostUid: payload.hostUid, duration: payload.durationMinutes });
      return bookingsApi.create(payload);
    },
    onSuccess: (data) => {
      trackEvent("booking.request.sent", { bookingId: data.booking.bookingId });
      qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
    },
    onError: (err) => {
      trackError("booking.request", err);
    },
  });
}

export function useMyBookings(window: BookingWindow) {
  return useQuery({
    queryKey: ["bookings", "mine", window],
    queryFn: () => bookingsApi.mine(window),
    staleTime: STALE_MS,
    select: (data) => data.bookings,
  });
}

export function useBookingDetails(bookingId: string | null) {
  return useQuery({
    queryKey: ["bookings", "details", bookingId],
    queryFn: () => bookingsApi.details(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: STALE_MS,
  });
}

function invalidateBookings(qc: ReturnType<typeof useQueryClient>, bookingId: string) {
  qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
  qc.invalidateQueries({ queryKey: ["bookings", "details", bookingId] });
}

export function useAcceptBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => {
      trackEvent("booking.accept.submit", { bookingId });
      return bookingsApi.accept(bookingId);
    },
    onSuccess: (_, id) => {
      trackEvent("booking.accept.success", { bookingId: id });
      invalidateBookings(qc, id);
    },
    onError: (err, id) => trackError("booking.accept", err, { bookingId: id }),
  });
}

export function useDeclineBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      trackEvent("booking.decline.submit", { bookingId });
      return bookingsApi.decline(bookingId, reason);
    },
    onSuccess: (_, v) => {
      trackEvent("booking.decline.success", { bookingId: v.bookingId });
      invalidateBookings(qc, v.bookingId);
    },
    onError: (err, v) => trackError("booking.decline", err, { bookingId: v.bookingId }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      trackEvent("booking.cancel.submit", { bookingId });
      return bookingsApi.cancel(bookingId, reason);
    },
    onSuccess: (_, v) => {
      trackEvent("booking.cancel.success", { bookingId: v.bookingId });
      invalidateBookings(qc, v.bookingId);
    },
    onError: (err, v) => trackError("booking.cancel", err, { bookingId: v.bookingId }),
  });
}

export function usePayBooking() {
  return useMutation({
    mutationFn: (bookingId: string) => {
      trackEvent("booking.pay.submit", { bookingId });
      return bookingsApi.pay(bookingId);
    },
    onSuccess: (_, id) => trackEvent("booking.pay.intent_created", { bookingId: id }),
    onError: (err, id) => trackError("booking.pay", err, { bookingId: id }),
  });
}
