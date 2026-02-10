import { apiClient } from "@/lib/api";

export type MembershipTier = {
  id: number;
  name: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  gender: "male" | "female" | "other" | null;
  location: string | null;
  totalSpent: number;
  membershipTier?: MembershipTier | null;
};

export type CustomerPayload = {
  name: string;
  phone: string;
  email: string | null;
  notes: string;
  gender: "male" | "female" | "other" | null;
  location: string | null;
};

export type CustomerListParams = {
  page: number;
  limit: number;
  search?: string;
  vipOnly?: boolean;
};

export type PaginatedCustomers = {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const customersService = {
  list() {
    return apiClient.get<Customer[]>("/customers");
  },
  listPaginated(params: CustomerListParams) {
    const query = new URLSearchParams();
    query.set("paginated", "1");
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.vipOnly) query.set("vip", "1");
    return apiClient.get<PaginatedCustomers>(`/customers?${query.toString()}`);
  },
  create(payload: CustomerPayload) {
    return apiClient.post<unknown>("/customers", payload);
  },
  update(id: number, payload: CustomerPayload) {
    return apiClient.put<unknown>(`/customers/${id}`, payload);
  },
  remove(id: number) {
    return apiClient.delete<unknown>(`/customers/${id}`);
  },
};
