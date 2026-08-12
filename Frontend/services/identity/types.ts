export type IdentityStatus = "unverified" | "pending" | "verified" | "rejected";
export type DocumentType = "passport" | "drivers_license" | "national_id";

export type Identity = {
  status: IdentityStatus;
  documentType: DocumentType | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export type SubmitIdentityPayload = {
  documentType: DocumentType;
  frontUrl: string;
  backUrl?: string;
  selfieUrl?: string;
};
