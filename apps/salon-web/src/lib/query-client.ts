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
  bookingStats: (from?: string, to?: string, branchId?: number) =>
    ["booking-stats", from ?? "", to ?? "", branchId ?? 0] as const,
  bookingDependencies: ["booking-dependencies"] as const,
  invoices: ["invoices"] as const,
  cashOverview: (from?: string, to?: string) => ["cash-overview", from ?? "", to ?? ""] as const,
  cashSessions: (from?: string, to?: string, status?: string) =>
    ["cash-sessions", from ?? "", to ?? "", status ?? ""] as const,
  cashTransactions: (sessionId?: number, from?: string, to?: string) =>
    ["cash-transactions", sessionId ?? 0, from ?? "", to ?? ""] as const,
  cashPaymentReport: (from?: string, to?: string) => ["cash-payment-report", from ?? "", to ?? ""] as const,
  cashPendingPayments: (from?: string, to?: string) =>
    ["cash-pending-payments", from ?? "", to ?? ""] as const,
  prepaidPlans: ["prepaid-plans"] as const,
  prepaidCards: (customerId?: number, status?: string) =>
    ["prepaid-cards", customerId ?? 0, status ?? ""] as const,
  prepaidTransactions: (cardId?: number, customerId?: number, from?: string, to?: string) =>
    ["prepaid-transactions", cardId ?? 0, customerId ?? 0, from ?? "", to ?? ""] as const,
  reminderSettings: ["reminder-settings"] as const,
  reminderLogs: (bookingId?: number, from?: string, to?: string) =>
    ["reminder-logs", bookingId ?? 0, from ?? "", to ?? ""] as const,
  approvalPolicy: ["approval-policy"] as const,
  approvalRequests: (status?: string, entityType?: string, from?: string, to?: string) =>
    ["approval-requests", status ?? "", entityType ?? "", from ?? "", to ?? ""] as const,
  branches: ["branches"] as const,
  branchMembers: (branchId?: number) => ["branch-members", branchId ?? 0] as const,
  payrollConfigs: (branchId?: number, staffId?: string) =>
    ["payroll-configs", branchId ?? 0, staffId ?? ""] as const,
  payrollCycles: (branchId?: number, status?: string, from?: string, to?: string) =>
    ["payroll-cycles", branchId ?? 0, status ?? "", from ?? "", to ?? ""] as const,
  payrollCycleItems: (cycleId?: number) => ["payroll-cycle-items", cycleId ?? 0] as const,
  settingsBundle: ["settings-bundle"] as const,
  profileOrganization: ["profile-organization"] as const,
  publicBookingOptions: (slug: string) => ["public-booking", "options", slug] as const,
};
