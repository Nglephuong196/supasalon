import { apiClient } from "@/lib/api";
import { branchesService, type BranchItem } from "./branches.service";
import type { Customer } from "./customers.service";
import { employeesService } from "./employees.service";
import { servicesService } from "./services.service";

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
  async stats(from?: string, to?: string, branchId?: number) {
    const query = toQuery({
      from,
      to,
      branchId,
      page: 1,
      limit: 500,
    });
    const list = await apiClient.get<BookingListResponse>(query ? `/bookings?${query}` : "/bookings");

    const stats = {
      total: list.total,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      cancelRate: 0,
      noShowRate: 0,
      lostRate: 0,
    };

    for (const item of list.data) {
      if (item.status === "pending") stats.pending += 1;
      if (item.status === "confirmed") stats.confirmed += 1;
      if (item.status === "completed") stats.completed += 1;
      if (item.status === "cancelled") stats.cancelled += 1;
      if (item.status === "no_show") stats.noShow += 1;
    }

    if (stats.total > 0) {
      stats.cancelRate = (stats.cancelled / stats.total) * 100;
      stats.noShowRate = (stats.noShow / stats.total) * 100;
      stats.lostRate = ((stats.cancelled + stats.noShow) / stats.total) * 100;
    }

    return stats as BookingStats;
  },
  listDependencies() {
    return Promise.all([
      apiClient.get<{ data: Customer[] }>("/customers?page=1&limit=200").then((result) => result.data),
      servicesService.listServices(),
      employeesService.list(),
      branchesService.list(),
    ]);
  },
  create(payload: BookingPayload) {
    return apiClient.post<BookingItem>("/bookings", payload);
  },
  async update(_: number, __: Partial<BookingPayload>) {
    throw new Error("Booking update endpoint is not available in apps/api yet.");
  },
  async updateStatus(_: number, __: BookingStatus, ___?: string) {
    throw new Error("Booking status endpoint is not available in apps/api yet.");
  },
  async remove(_: number) {
    throw new Error("Booking delete endpoint is not available in apps/api yet.");
  },
};
