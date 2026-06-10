export type SendOtpPayload = {
  phoneNumber: string; // E.164 format
};

export type VerifyOtpPayload = {
  phoneNumber: string;
  code: string;
};

export type SendVerifyEmailPayload = {
  email: string;
  displayName?: string;
};

export type VerifyEmailCodePayload = {
  email: string;
  code: string;
};

export type OtpResponse = {
  message: string;
};

export type VerifyEmailResponse = {
  message: string;
  emailVerified?: boolean;
};
