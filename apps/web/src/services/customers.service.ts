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
  async list() {
    const query = new URLSearchParams({
      page: "1",
      limit: "200",
    });
    const result = await apiClient.get<PaginatedCustomers>(`/customers?${query.toString()}`);
    return result.data;
  },
  listPaginated(params: CustomerListParams) {
    const query = new URLSearchParams();
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.vipOnly) query.set("vipOnly", "true");
    return apiClient.get<PaginatedCustomers>(`/customers?${query.toString()}`);
  },
  create(payload: CustomerPayload) {
    return apiClient.post<Customer>("/customers", payload);
  },
  async update(_: number, __: CustomerPayload) {
    throw new Error("Customer update endpoint is not available in apps/api yet.");
  },
  async remove(_: number) {
    throw new Error("Customer delete endpoint is not available in apps/api yet.");
  },
};
