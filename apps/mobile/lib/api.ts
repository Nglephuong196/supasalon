import * as SecureStore from "expo-secure-store";
import { authClient } from "./auth-client";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8787";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function getOrganizationId(): Promise<string | null> {
  try {
    // Try to get active organization from session
    const session = await authClient.getSession();
    console.log("[API] Session data:", JSON.stringify(session.data));

    const orgId = session.data?.session?.activeOrganizationId;
    if (orgId) {
      return orgId;
    }

    // Fallback: try organization client to get list of orgs
    const orgs = await authClient.organization?.list();
    console.log("[API] Organizations:", JSON.stringify(orgs?.data));

    if (orgs?.data && orgs.data.length > 0) {
      return orgs.data[0].id;
    }
  } catch (error) {
    console.error("[API] Error getting organization ID:", error);
  }
  return null;
}

async function getSessionCookie(): Promise<string | null> {
  try {
    // Get session token directly from the auth client session
    const session = await authClient.getSession();
    const token = session.data?.session?.token;

    if (token) {
      console.log("[API] Using session token from authClient");
      return token; // Return just the token
    }

    console.log("[API] No session token available");
  } catch (error) {
    console.error("[API] Error getting session cookie:", error);
  }
  return null;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Get organization ID and session cookie
  const [orgId, sessionCookie] = await Promise.all([getOrganizationId(), getSessionCookie()]);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (orgId) {
    headers["X-Organization-Id"] = orgId;
  } else {
    console.warn("[API] No organization ID available!");
  }

  if (sessionCookie) {
    headers["Authorization"] = `Bearer ${sessionCookie}`;
  } else {
    console.warn("[API] No session token available!");
  }

  console.log("[API] Fetching:", url, "OrgId:", orgId, "HasCookie:", !!sessionCookie);

  // Use native fetch - better-auth expo client intercepts it globally
  const response = await fetch(url, {
    method: fetchOptions.method || "GET",
    headers,
    body: fetchOptions.body,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[API] Error:", response.status, errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API client methods
export const api = {
  // Dashboard / Stats
  async getDashboardStats() {
    // Aggregate stats from various endpoints
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
    return bookings.sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  },

  // Bookings - pass simple=true to get array instead of paginated object
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

  // Invoices - already returns array
  async getInvoices(params?: Record<string, string>) {
    return apiFetch<any[]>("/invoices", { params });
  },

  // Customers - already returns array
  async getCustomers(params?: Record<string, string>) {
    return apiFetch<any[]>("/customers", { params });
  },

  // Members/Employees
  async getMembers() {
    return apiFetch<any[]>("/members");
  },
};

export default api;
