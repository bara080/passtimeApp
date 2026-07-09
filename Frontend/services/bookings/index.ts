import { axiosInstance } from "@/utils/httpClient";
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

  create: async (payload: CreateBookingPayload): Promise<{ booking: Booking }> => {
    const res = await axiosInstance.post("/bookings", payload);
    return unwrap(res);
  },

  mine: async (window: BookingWindow): Promise<{ window: BookingWindow; bookings: Booking[] }> => {
    const res = await axiosInstance.get("/bookings/mine", { params: { window } });
    return unwrap(res);
  },

  details: async (bookingId: string): Promise<{ booking: Booking; viewerRole: "member" | "host" }> => {
    const res = await axiosInstance.get(`/bookings/${bookingId}`);
    return unwrap(res);
  },

  accept: async (bookingId: string): Promise<{ booking: Booking }> => {
    const res = await axiosInstance.post(`/bookings/${bookingId}/accept`);
    return unwrap(res);
  },

  decline: async (bookingId: string, reason: string): Promise<{ booking: Booking }> => {
    const res = await axiosInstance.post(`/bookings/${bookingId}/decline`, { reason });
    return unwrap(res);
  },

  cancel: async (bookingId: string, reason?: string): Promise<{ booking: Booking }> => {
    const res = await axiosInstance.post(`/bookings/${bookingId}/cancel`, reason ? { reason } : {});
    return unwrap(res);
  },

  pay: async (bookingId: string): Promise<{ paymentIntentId: string; clientSecret: string; amount: number; currency: string }> => {
    const res = await axiosInstance.post(`/bookings/${bookingId}/pay`);
    return unwrap(res);
  },
};

export * from "./types";
