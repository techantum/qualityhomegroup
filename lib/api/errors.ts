/**
 * Structured API error responses and helpers.
 */

import { NextResponse } from "next/server";

export const API_ERRORS = {
  UNAUTHORIZED: { message: "Unauthorized", status: 401 },
  FORBIDDEN: { message: "Forbidden", status: 403 },
  BAD_REQUEST: { message: "Bad request", status: 400 },
  NOT_FOUND: { message: "Resource not found", status: 404 },
  CONFLICT: { message: "Conflict", status: 409 },
  TOO_MANY_REQUESTS: { message: "Too many requests", status: 429 },
  SERVICE_UNAVAILABLE: { message: "Service unavailable", status: 503 },
  INTERNAL: { message: "Internal server error", status: 500 },
} as const;

export type ApiErrorCode = keyof typeof API_ERRORS;

export interface ApiErrorPayload {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Return a JSON error response with consistent shape.
 */
export function apiError(
  code: ApiErrorCode,
  details?: unknown,
  overrideMessage?: string
): NextResponse<ApiErrorPayload> {
  const def = API_ERRORS[code];
  const body: ApiErrorPayload = {
    error: overrideMessage ?? def.message,
    code: code.toLowerCase(),
    ...(details != null && { details }),
  };
  return NextResponse.json(body, { status: def.status });
}

/**
 * Wrap a generic error for 500 response.
 */
export function apiInternalError(err: unknown): NextResponse<ApiErrorPayload> {
  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json(
    { error: message, code: "internal" },
    { status: 500 }
  );
}
