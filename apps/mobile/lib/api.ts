import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  (globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }).process?.env
    ?.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5263";

const ACCESS_TOKEN_KEY = "api.accessToken";
const BRANCH_ID_KEY = "branchId";
const BRANCH_HEADER_NAME = "X-Branch-Id";

type ApiContext = {
  branchId: string | null;
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

const runtimeContext: ApiContext = {
  branchId: null,
};

async function readStorage(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function writeStorage(key: string, value: string | null): Promise<void> {
  if (value) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getApiAuthToken(): Promise<string | null> {
  return readStorage(ACCESS_TOKEN_KEY);
}

export async function setApiAuthToken(token: string): Promise<void> {
  await writeStorage(ACCESS_TOKEN_KEY, token);
}

export async function clearApiAuthToken(): Promise<void> {
  await writeStorage(ACCESS_TOKEN_KEY, null);
}

async function getDefaultBranchId(): Promise<string | null> {
  return runtimeContext.branchId ?? (await readStorage(BRANCH_ID_KEY));
}

async function saveBranchId(branchId: string | null): Promise<void> {
  await writeStorage(BRANCH_ID_KEY, branchId);
}

export async function setApiContext(partial: Partial<ApiContext>): Promise<void> {
  if (typeof partial.branchId !== "undefined") {
    runtimeContext.branchId = partial.branchId;
    await saveBranchId(partial.branchId ?? null);
  }
}

export async function clearApiContext(): Promise<void> {
  runtimeContext.branchId = null;
  await saveBranchId(null);
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

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const requestPath = normalizePath(endpoint);

  let requestUrl = requestPath.startsWith("http") ? requestPath : `${API_BASE_URL}${requestPath}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    requestUrl += `?${searchParams.toString()}`;
  }

  const token = await getApiAuthToken();
  const branchId = await getDefaultBranchId();
  const needApiContext = requiresApiContext(requestPath);

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (branchId && needApiContext) {
    headers.set(BRANCH_HEADER_NAME, branchId);
  }

  if (token && shouldAttachAuth(requestPath)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(requestUrl, {
    method: fetchOptions.method || "GET",
    headers,
    body: fetchOptions.body,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  get<T>(path: string, options?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, json?: unknown, options?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...options, method: "POST", body: JSON.stringify(json ?? {}) });
  },
  put<T>(path: string, json?: unknown, options?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...options, method: "PUT", body: JSON.stringify(json ?? {}) });
  },
  patch<T>(path: string, json?: unknown, options?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...options, method: "PATCH", body: JSON.stringify(json ?? {}) });
  },
  delete<T>(path: string, options?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...options, method: "DELETE" });
  },
};

export const api = {
  async getDashboardStats() {
    const [bookings, invoices, customers] = await Promise.all([
      this.getBookings({ from: new Date().toISOString().split("T")[0] }),
      this.getInvoices(),
      this.getCustomers(),
    ]);

    const todayBookings = bookings.filter((b: any) => {
      const bookingDate = new Date(b.date).toDateString();
      const today = new Date().toDateString();
      return bookingDate === today;
    });

    const paidInvoices = invoices.filter((i: any) => i.status === "paid");
    const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
    const avgInvoice = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    return {
      totalRevenue,
      todayAppointments: todayBookings.length,
      newCustomers: customers.length,
      avgInvoice,
    };
  },

  async getTodayBookings() {
    const today = new Date().toISOString().split("T")[0];
    const bookings = await this.getBookings({ from: today, to: today });
    return bookings.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async getBookings(params?: Record<string, string>) {
    return apiFetch<any[]>("/bookings", {
      params: { simple: "true", ...params },
    });
  },

  async getBookingStats() {
    const bookings = await this.getBookings();
    const total = bookings.length;
    const pending = bookings.filter((b: any) => b.status === "pending").length;
    const completed = bookings.filter((b: any) => b.status === "completed").length;
    const cancelled = bookings.filter((b: any) => b.status === "cancelled").length;
    const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    return { total, pending, completed, cancelRate };
  },

  async getInvoices(params?: Record<string, string>) {
    return apiFetch<any[]>("/invoices", { params });
  },

  async getCustomers(params?: Record<string, string>) {
    return apiFetch<any[]>("/customers", { params });
  },

  async getMembers() {
    return apiFetch<any[]>("/members");
  },
};

export default api;
