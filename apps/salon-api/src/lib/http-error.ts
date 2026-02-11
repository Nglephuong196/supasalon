export class HttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    super(
      typeof payload === "object" && payload && "error" in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).error)
        : `HTTP ${status}`,
    );
    this.status = status;
    this.payload = payload;
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, { error: message });
}

export function unauthorized(message = "Unauthorized"): never {
  throw new HttpError(401, { error: message });
}

export function forbidden(message = "Forbidden"): never {
  throw new HttpError(403, { error: message });
}

export function notFound(message = "Not found"): never {
  throw new HttpError(404, { error: message });
}
