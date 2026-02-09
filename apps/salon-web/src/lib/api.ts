const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:8787";

type ApiContext = {
  organizationId: string | null;
  sessionId: string | null;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  body?: BodyInit | null;
};

const runtimeContext: ApiContext = {
  organizationId: null,
  sessionId: null,
};
let organizationBootstrapPromise: Promise<string | null> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getDefaultOrganizationId(): string | null {
  return (
    runtimeContext.organizationId ??
    readCookie("organizationId") ??
    (typeof localStorage !== "undefined" ? localStorage.getItem("organizationId") : null)
  );
}

function getDefaultSessionId(): string | null {
  return (
    runtimeContext.sessionId ??
    readCookie("sessionId") ??
    readCookie("better-auth.session_token") ??
    (typeof localStorage !== "undefined" ? localStorage.getItem("sessionId") : null)
  );
}

function extractActiveOrganizationId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const session = (record.session ?? record.data) as Record<string, unknown> | undefined;
  const directActive = session?.activeOrganizationId ?? record.activeOrganizationId;
  return typeof directActive === "string" && directActive.length > 0 ? directActive : null;
}

function extractOrganizationList(payload: unknown): Array<{ id: string }> {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const source = (record.data ?? record.organizations ?? record) as unknown;
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const id = (item as Record<string, unknown>).id;
      return typeof id === "string" ? { id } : null;
    })
    .filter((item): item is { id: string } => item !== null);
}

async function bootstrapOrganizationId(): Promise<string | null> {
  // 1) Try current session for active organization.
  try {
    const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      credentials: "include",
    });
    if (sessionResponse.ok) {
      const sessionPayload = await sessionResponse.json();
      const activeOrganizationId = extractActiveOrganizationId(sessionPayload);
      if (activeOrganizationId) {
        runtimeContext.organizationId = activeOrganizationId;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("organizationId", activeOrganizationId);
        }
        return activeOrganizationId;
      }
    }
  } catch {
    // Ignore and continue with organization list fallback.
  }

  // 2) Fallback: list organizations and set first active.
  try {
    const listResponse = await fetch(`${API_BASE_URL}/api/auth/organization/list`, {
      credentials: "include",
    });
    if (!listResponse.ok) return null;
    const listPayload = await listResponse.json();
    const organizations = extractOrganizationList(listPayload);
    const firstOrganization = organizations[0];
    if (!firstOrganization) return null;

    await fetch(`${API_BASE_URL}/api/auth/organization/set-active`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId: firstOrganization.id }),
    });

    runtimeContext.organizationId = firstOrganization.id;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("organizationId", firstOrganization.id);
    }
    return firstOrganization.id;
  } catch {
    return null;
  }
}

async function ensureOrganizationId(): Promise<string | null> {
  const existing = getDefaultOrganizationId();
  if (existing) return existing;

  if (!organizationBootstrapPromise) {
    organizationBootstrapPromise = bootstrapOrganizationId().finally(() => {
      organizationBootstrapPromise = null;
    });
  }
  return organizationBootstrapPromise;
}

export function setApiContext(partial: Partial<ApiContext>) {
  if (typeof partial.organizationId !== "undefined") {
    runtimeContext.organizationId = partial.organizationId;
  }
  if (typeof partial.sessionId !== "undefined") {
    runtimeContext.sessionId = partial.sessionId;
  }
}

export function clearApiContext() {
  runtimeContext.organizationId = null;
  runtimeContext.sessionId = null;
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = payload.error ?? payload.message;
    if (typeof message === "string") return message;
  } catch {
    // Ignore parse failures and fallback to status text.
  }
  return response.statusText || `API error (${response.status})`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, body, ...rest } = options;

  const organizationId =
    path.startsWith("/api/auth") || path.startsWith("/public/")
      ? getDefaultOrganizationId()
      : await ensureOrganizationId();
  const sessionId = getDefaultSessionId();

  const requestHeaders = new Headers(headers);
  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (organizationId) {
    requestHeaders.set("X-Organization-Id", organizationId);
  }
  if (sessionId) {
    // Backend expects a plain sessionId header.
    requestHeaders.set("sessionId", sessionId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
    ...rest,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "json" | "body">) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, json?: unknown, options?: Omit<RequestOptions, "method" | "json">) {
    return apiRequest<T>(path, { ...options, method: "POST", json });
  },
  put<T>(path: string, json?: unknown, options?: Omit<RequestOptions, "method" | "json">) {
    return apiRequest<T>(path, { ...options, method: "PUT", json });
  },
  patch<T>(path: string, json?: unknown, options?: Omit<RequestOptions, "method" | "json">) {
    return apiRequest<T>(path, { ...options, method: "PATCH", json });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, "method">) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};
