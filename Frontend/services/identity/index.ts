import { axiosInstance } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type { Identity, SubmitIdentityPayload } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const identityApi = {
  status: async (): Promise<{ identity: Identity }> => unwrap(await axiosInstance.get("/identity")),

  submit: async (payload: SubmitIdentityPayload): Promise<{ identity: Identity }> =>
    withSingleFlight("identity-submit", async () =>
      unwrap(await axiosInstance.post("/identity/submit", payload))),
};

export * from "./types";
