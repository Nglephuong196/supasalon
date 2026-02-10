import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  dashboardOverview: (range: string) => ["dashboard", "overview", range] as const,
  customers: ["customers"] as const,
  customersList: (params: Record<string, unknown>) => ["customers", "list", params] as const,
  employees: ["employees"] as const,
  employeesList: (params: Record<string, unknown>) => ["employees", "list", params] as const,
  services: ["services"] as const,
  serviceCategories: ["service-categories"] as const,
  products: ["products"] as const,
  productCategories: ["product-categories"] as const,
  bookings: (filters: Record<string, unknown>) => ["bookings", filters] as const,
  bookingStats: (from?: string, to?: string) => ["booking-stats", from ?? "", to ?? ""] as const,
  bookingDependencies: ["booking-dependencies"] as const,
  invoices: ["invoices"] as const,
  settingsBundle: ["settings-bundle"] as const,
  profileOrganization: ["profile-organization"] as const,
  publicBookingOptions: (slug: string) => ["public-booking", "options", slug] as const,
};
