import { apiFetch } from ".";

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  token?: string; // Only in development
  expires_at?: string;
}

export interface PasswordResetValidateResponse {
  valid: boolean;
  message: string | null;
}

export interface PasswordResetCompleteRequest {
  token: string;
  new_password: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export function requestPasswordReset(payload: PasswordResetRequest) {
  return {
    endpoint: "/password-reset/request",
    method: "POST" as const,
    body: payload,
  };
}

export async function validatePasswordResetToken(token: string) {
  return apiFetch<PasswordResetValidateResponse>(
    "/password-reset/validate",
    {
      method: "GET",
      query: { token },
    }
  );
}

export function completePasswordReset(payload: PasswordResetCompleteRequest) {
  return {
    endpoint: "/password-reset/complete",
    method: "POST" as const,
    body: payload,
  };
}

export interface PasswordChangeResponse {
  message: string;
  token?: string;
}

export function changePassword(payload: PasswordChangeRequest) {
  return {
    endpoint: "/password-reset/change",
    method: "POST" as const,
    body: payload,
  };
}
