const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5263";

const ACCESS_TOKEN_KEY = "api.accessToken";
const BRANCH_ID_KEY = "branchId";
const BRANCH_HEADER_NAME = "X-Branch-Id";

type ApiContext = {
  branchId: string | null;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  body?: BodyInit | null;
};

const runtimeContext: ApiContext = {
  branchId: null,
};

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string | null) {
  if (typeof localStorage === "undefined") return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

export function getApiAuthToken(): string | null {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function setApiAuthToken(token: string) {
  writeStorage(ACCESS_TOKEN_KEY, token);
}

export function clearApiAuthToken() {
  writeStorage(ACCESS_TOKEN_KEY, null);
}

function getDefaultBranchId(): string | null {
  return runtimeContext.branchId ?? readStorage(BRANCH_ID_KEY) ?? null;
}

function saveBranchId(branchId: string | null) {
  writeStorage(BRANCH_ID_KEY, branchId);
}

export function setApiContext(partial: Partial<ApiContext>) {
  if (typeof partial.branchId !== "undefined") {
    runtimeContext.branchId = partial.branchId;
    saveBranchId(partial.branchId ?? null);
  }
}

export function clearApiContext() {
  runtimeContext.branchId = null;
}

function normalizePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/api/") || path === "/api") {
    return path;
  }

  if (path.startsWith("/public/")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `/api${path}`;
  }

  return `/api/${path}`;
}

function requiresApiContext(path: string): boolean {
  if (!path.startsWith("/api/")) return false;
  if (path.startsWith("/api/auth/")) return false;
  return true;
}

function shouldAttachAuth(path: string): boolean {
  if (!path.startsWith("/api")) return false;
  if (path === "/api/auth/login" || path === "/api/auth/register") return false;
  return true;
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = payload.error ?? payload.message;
    if (typeof message === "string") return message;

    const errors = payload.errors;
    if (Array.isArray(errors) && errors.every((item) => typeof item === "string")) {
      return errors.join("; ");
    }
  } catch {
    // Ignore parse failures and fallback to status text.
  }
  return response.statusText || `API error (${response.status})`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, body, ...rest } = options;

  let requestPath = normalizePath(path);
  const branchId = getDefaultBranchId();
  const needApiContext = requiresApiContext(requestPath);

  const requestHeaders = new Headers(headers);
  const token = getApiAuthToken();

  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (branchId && needApiContext) {
    requestHeaders.set(BRANCH_HEADER_NAME, branchId);
  }

  if (token && shouldAttachAuth(requestPath)) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const finalJson = json;

  const requestUrl = requestPath.startsWith("http") ? requestPath : `${API_BASE_URL}${requestPath}`;

  const response = await fetch(requestUrl, {
    headers: requestHeaders,
    body: finalJson !== undefined ? JSON.stringify(finalJson) : body,
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
