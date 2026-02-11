import { apiClient } from "@/lib/api";

export type ApprovalPolicy = {
  id: number;
  organizationId: string;
  requireInvoiceCancelApproval: boolean;
  requireInvoiceRefundApproval: boolean;
  invoiceRefundThreshold: number;
  requireCashOutApproval: boolean;
  cashOutThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalRequest = {
  id: number;
  organizationId: string;
  entityType: "invoice" | "cash_transaction" | "booking" | "commission_payout" | "prepaid_card";
  entityId?: number | null;
  action: string;
  payload?: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestReason?: string | null;
  reviewReason?: string | null;
  requestedByUserId?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  executedAt?: string | null;
  createdAt: string;
  requestedBy?: { id: string; name?: string | null; email?: string | null } | null;
  reviewedBy?: { id: string; name?: string | null; email?: string | null } | null;
};

export const approvalsService = {
  getPolicy() {
    return apiClient.get<ApprovalPolicy>("/approval-requests/policy");
  },
  updatePolicy(payload: Partial<ApprovalPolicy>) {
    return apiClient.put<ApprovalPolicy>("/approval-requests/policy", payload);
  },
  listRequests(filters?: {
    status?: "pending" | "approved" | "rejected" | "cancelled";
    entityType?: "invoice" | "cash_transaction" | "booking" | "commission_payout" | "prepaid_card";
    from?: string;
    to?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.entityType) params.set("entityType", filters.entityType);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const query = params.toString();
    return apiClient.get<ApprovalRequest[]>(
      query ? `/approval-requests?${query}` : "/approval-requests",
    );
  },
  approve(id: number, payload?: { reviewReason?: string }) {
    return apiClient.patch<{ approved: ApprovalRequest; executionResult?: Record<string, unknown> | null }>(
      `/approval-requests/${id}/approve`,
      payload,
    );
  },
  reject(id: number, payload?: { reviewReason?: string }) {
    return apiClient.patch<ApprovalRequest>(`/approval-requests/${id}/reject`, payload);
  },
};
