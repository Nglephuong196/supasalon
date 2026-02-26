import { apiClient } from "@/lib/api";
import type { Customer } from "./customers.service";

export type PrepaidUnit = "vnd" | "credit";

export type PrepaidPlan = {
  id: number;
  organizationId: string;
  name: string;
  description?: string | null;
  unit: PrepaidUnit;
  salePrice: number;
  initialBalance: number;
  expiryDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PrepaidCard = {
  id: number;
  organizationId: string;
  customerId: number;
  planId?: number | null;
  cardCode: string;
  unit: PrepaidUnit;
  purchasePrice: number;
  initialBalance: number;
  remainingBalance: number;
  status: "active" | "expired" | "cancelled";
  notes?: string | null;
  purchasedAt: string;
  expiredAt?: string | null;
  customer?: Customer;
  plan?: PrepaidPlan | null;
};

export type PrepaidTransaction = {
  id: number;
  organizationId: string;
  cardId: number;
  customerId: number;
  invoiceId?: number | null;
  type: "purchase" | "consume" | "topup" | "adjust" | "expire" | "refund";
  amount: number;
  balanceAfter: number;
  notes?: string | null;
  createdAt: string;
  card?: PrepaidCard;
};

export type PrepaidPlanPayload = {
  name: string;
  description?: string;
  unit: PrepaidUnit;
  salePrice: number;
  initialBalance: number;
  expiryDays: number;
  isActive?: boolean;
};

export const prepaidService = {
  listPlans() {
    return apiClient.get<PrepaidPlan[]>("/prepaid/plans");
  },
  createPlan(payload: PrepaidPlanPayload) {
    return apiClient.post<PrepaidPlan>("/prepaid/plans", payload);
  },
  updatePlan(id: number, payload: Partial<PrepaidPlanPayload>) {
    return apiClient.put<PrepaidPlan>(`/prepaid/plans/${id}`, payload);
  },
  deletePlan(id: number) {
    return apiClient.delete<{ message: string }>(`/prepaid/plans/${id}`);
  },
  listCards(filters?: {
    customerId?: number;
    status?: "active" | "expired" | "cancelled";
  }) {
    const params = new URLSearchParams();
    if (filters?.customerId) params.set("customerId", String(filters.customerId));
    if (filters?.status) params.set("status", filters.status);
    const query = params.toString();
    return apiClient.get<PrepaidCard[]>(query ? `/prepaid/cards?${query}` : "/prepaid/cards");
  },
  createCard(payload: {
    customerId: number;
    planId?: number;
    cardCode?: string;
    unit?: PrepaidUnit;
    purchasePrice?: number;
    initialBalance?: number;
    expiredAt?: string;
    notes?: string;
  }) {
    return apiClient.post<PrepaidCard>("/prepaid/cards", payload);
  },
  consumeCard(cardId: number, payload: { amount: number; invoiceId?: number; notes?: string }) {
    return apiClient.post<{ card: PrepaidCard; transaction: PrepaidTransaction }>(
      `/prepaid/cards/${cardId}/consume`,
      payload,
    );
  },
  topupCard(cardId: number, payload: { amount: number; notes?: string }) {
    return apiClient.post<{ card: PrepaidCard; transaction: PrepaidTransaction }>(
      `/prepaid/cards/${cardId}/topup`,
      payload,
    );
  },
  listTransactions(filters?: { cardId?: number; customerId?: number; from?: string; to?: string }) {
    const params = new URLSearchParams();
    if (filters?.cardId) params.set("cardId", String(filters.cardId));
    if (filters?.customerId) params.set("customerId", String(filters.customerId));
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const query = params.toString();
    return apiClient.get<PrepaidTransaction[]>(
      query ? `/prepaid/transactions?${query}` : "/prepaid/transactions",
    );
  },
};
