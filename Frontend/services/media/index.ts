import { axiosInstance } from "@/utils/httpClient";

export type MediaKind = "avatar" | "photo";

export type UploadUrlResponse = {
  uploadUrl: string;
  path: string;
  contentType: string;
};

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const mediaApi = {
  createUploadUrl: async (kind: MediaKind, contentType: string): Promise<UploadUrlResponse> => {
    const res = await axiosInstance.post("/media/upload-url", { kind, contentType });
    return unwrap(res);
  },

  confirmUpload: async (path: string): Promise<{ url: string; path: string }> => {
    const res = await axiosInstance.post("/media/confirm", { path });
    return unwrap(res);
  },

  /** Full pipeline: signed URL → direct PUT → confirm. Returns the permanent public URL. */
  uploadImage: async (kind: MediaKind, localUri: string): Promise<string> => {
    const contentType = guessContentType(localUri);
    const { uploadUrl, path } = await mediaApi.createUploadUrl(kind, contentType);
    const blob = await (await fetch(localUri)).blob();
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!put.ok) throw new Error("Image upload failed. Please try again.");
    const { url } = await mediaApi.confirmUpload(path);
    return url;
  },

  /** Same pipeline as uploadImage but returns both the storage path and URL
   *  (host photo records persist the pair for ownership verification). */
  uploadImageWithPath: async (kind: MediaKind, localUri: string): Promise<{ path: string; url: string }> => {
    const contentType = guessContentType(localUri);
    const { uploadUrl, path } = await mediaApi.createUploadUrl(kind, contentType);
    const blob = await (await fetch(localUri)).blob();
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!put.ok) throw new Error("Image upload failed. Please try again.");
    const { url } = await mediaApi.confirmUpload(path);
    return { path, url };
  },
};

function guessContentType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}
