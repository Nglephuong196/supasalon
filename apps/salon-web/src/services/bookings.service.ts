import { apiClient } from "@/lib/api";
import type { BranchItem } from "./branches.service";
import type { Customer } from "./customers.service";
import type { EmployeeMember } from "./employees.service";
import type { ServiceItem } from "./services.service";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checkin"
  | "completed"
  | "cancelled"
  | "no_show";

export type BookingServiceEntry = {
  categoryId?: number;
  serviceId: number;
  memberId?: string;
  price?: number;
};

export type BookingGuest = {
  services: BookingServiceEntry[];
};

export type BookingItem = {
  id: number;
  customerId: number;
  branchId?: number | null;
  branch?: BranchItem | null;
  customer?: Customer;
  date: string;
  status: BookingStatus;
  notes?: string | null;
  depositAmount?: number;
  depositPaid?: number;
  noShowReason?: string | null;
  noShowAt?: string | null;
  guestCount: number;
  guests: BookingGuest[];
  createdAt?: string;
};

export type BookingStats = {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  cancelRate: number;
  noShowRate: number;
  lostRate: number;
};

export type BookingListResponse = {
  data: BookingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type BookingFilters = {
  branchId?: number;
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type BookingPayload = {
  customerId: number;
  branchId?: number;
  guests: BookingGuest[];
  guestCount: number;
  date: string;
  notes?: string;
  depositAmount?: number;
  depositPaid?: number;
  noShowReason?: string;
  status?: BookingStatus;
};

function toQuery(filters: BookingFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.branchId) params.set("branchId", String(filters.branchId));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString();
}

export const bookingsService = {
  list(filters: BookingFilters) {
    const query = toQuery(filters);
    return apiClient.get<BookingListResponse>(query ? `/bookings?${query}` : "/bookings");
  },
  stats(from?: string, to?: string, branchId?: number) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (branchId) params.set("branchId", String(branchId));
    const query = params.toString();
    return apiClient.get<BookingStats>(query ? `/bookings/stats?${query}` : "/bookings/stats");
  },
  listDependencies() {
    return Promise.all([
      apiClient.get<Customer[]>("/customers"),
      apiClient.get<ServiceItem[]>("/services"),
      apiClient.get<EmployeeMember[]>("/members"),
      apiClient.get<BranchItem[]>("/branches"),
    ]);
  },
  create(payload: BookingPayload) {
    return apiClient.post<BookingItem>("/bookings", payload);
  },
  update(id: number, payload: Partial<BookingPayload>) {
    return apiClient.put<BookingItem>(`/bookings/${id}`, payload);
  },
  updateStatus(id: number, status: BookingStatus, noShowReason?: string) {
    return apiClient.patch<BookingItem>(`/bookings/${id}/status`, { status, noShowReason });
  },
  remove(id: number) {
    return apiClient.delete<{ message: string }>(`/bookings/${id}`);
  },
};
