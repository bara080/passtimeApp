import { axiosInstance } from "@/utils/httpClient";
import type { TransactionsResponse, TransactionResponse } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const paymentsApi = {
  list: async (): Promise<TransactionsResponse> => unwrap(await axiosInstance.get("/payments")),
  detail: async (paymentId: string): Promise<TransactionResponse> =>
    unwrap(await axiosInstance.get(`/payments/${paymentId}`)),
};

export * from "./types";
