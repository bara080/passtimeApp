import { axiosInstance } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type {
  Booking,
  BookingWindow,
  CreateBookingPayload,
  SlotsResponse,
} from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const bookingsApi = {
  slots: async (hostUid: string, date: string): Promise<SlotsResponse> => {
    const res = await axiosInstance.get("/bookings/slots", { params: { hostUid, date } });
    return unwrap(res);
  },

  // Single-flight keyed by host+slot so a double-tapped "Request" can't fire two
  // creates; the auto Idempotency-Key header dedupes any that still get through.
  create: async (payload: CreateBookingPayload): Promise<{ booking: Booking }> =>
    withSingleFlight(`booking-create:${payload.hostUid}:${payload.startAt}`, async () => {
      const res = await axiosInstance.post("/bookings", payload);
      return unwrap(res);
    }),

  mine: async (window: BookingWindow): Promise<{ window: BookingWindow; bookings: Booking[] }> => {
    const res = await axiosInstance.get("/bookings/mine", { params: { window } });
    return unwrap(res);
  },

  details: async (bookingId: string): Promise<{ booking: Booking; viewerRole: "member" | "host" }> => {
    const res = await axiosInstance.get(`/bookings/${bookingId}`);
    return unwrap(res);
  },

  accept: async (bookingId: string): Promise<{ booking: Booking }> =>
    withSingleFlight(`booking-accept:${bookingId}`, async () => {
      const res = await axiosInstance.post(`/bookings/${bookingId}/accept`);
      return unwrap(res);
    }),

  decline: async (bookingId: string, reason: string): Promise<{ booking: Booking }> =>
    withSingleFlight(`booking-decline:${bookingId}`, async () => {
      const res = await axiosInstance.post(`/bookings/${bookingId}/decline`, { reason });
      return unwrap(res);
    }),

  cancel: async (bookingId: string, reason?: string): Promise<{ booking: Booking }> =>
    withSingleFlight(`booking-cancel:${bookingId}`, async () => {
      const res = await axiosInstance.post(`/bookings/${bookingId}/cancel`, reason ? { reason } : {});
      return unwrap(res);
    }),

  // P0 money path — single-flight stops a double-tap creating a second
  // PaymentIntent; the Stripe-native key on the server is the 24h backstop.
  pay: async (bookingId: string): Promise<{ paymentIntentId: string; clientSecret: string; amount: number; currency: string }> =>
    withSingleFlight(`booking-pay:${bookingId}`, async () => {
      const res = await axiosInstance.post(`/bookings/${bookingId}/pay`);
      return unwrap(res);
    }),
};

export * from "./types";
