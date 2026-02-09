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

export const customersService = {
  list() {
    return apiClient.get<Customer[]>("/customers");
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
