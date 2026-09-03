export type ApiErrorPayload = {
  name?: string;
  description?: string;
  code: string; // напр. "HTTP_401" или доменный "AUTH.INVALID_TOKEN"
  message: string;
  status?: number | undefined; // HTTP
  detail?: string | undefined;
  meta?: Record<string, unknown> | undefined;
};

export class ApiError extends Error {
  readonly payload: ApiErrorPayload;
  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.payload = payload;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  toPayload(): ApiErrorPayload {
    return this.payload;
  }
}
