import { apiClient } from "@/lib/api";
import type {
  ApprovalPendingResponse,
  InvoicePayment,
  InvoicePaymentMethod,
} from "./invoices.service";

export type CashSessionStatus = "open" | "closed";

export type CashSession = {
  id: number;
  organizationId: string;
  openedByUserId?: string | null;
  closedByUserId?: string | null;
  openingBalance: number;
  expectedClosingBalance: number;
  actualClosingBalance?: number | null;
  discrepancy?: number | null;
  status: CashSessionStatus;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  openedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  closedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type CashSessionSnapshot = {
  sessionId: number;
  openingBalance: number;
  invoiceCashIn: number;
  invoiceCashOut: number;
  manualIn: number;
  manualOut: number;
  expectedClosingBalance: number;
};

export type CashTransaction = {
  id: number;
  organizationId: string;
  cashSessionId: number;
  type: "in" | "out";
  category: string;
  amount: number;
  notes?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type PaymentMethodReportItem = {
  method: InvoicePaymentMethod;
  received: number;
  refunded: number;
  net: number;
  pendingCount: number;
  confirmedCount: number;
};

export type PendingInvoicePayment = InvoicePayment & {
  invoice?: {
    id: number;
    total: number;
    customer?: {
      id: number;
      name?: string | null;
      phone?: string | null;
    } | null;
  };
};

export type CashOverview = {
  currentSession: CashSession | null;
  currentSnapshot: CashSessionSnapshot | null;
  paymentReport: PaymentMethodReportItem[];
  pendingPaymentsCount: number;
};

function withQuery(path: string, query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const cashManagementService = {
  overview(filters?: { from?: string; to?: string }) {
    return apiClient.get<CashOverview>(
      withQuery("/cash-management/overview", {
        from: filters?.from,
        to: filters?.to,
      }),
    );
  },
  currentSession() {
    return apiClient.get<{
      currentSession: CashSession | null;
      currentSnapshot: CashSessionSnapshot | null;
    }>("/cash-management/session/current");
  },
  listSessions(filters?: { from?: string; to?: string; status?: CashSessionStatus }) {
    return apiClient.get<CashSession[]>(
      withQuery("/cash-management/sessions", {
        from: filters?.from,
        to: filters?.to,
        status: filters?.status,
      }),
    );
  },
  openSession(payload: { openingBalance: number; notes?: string }) {
    return apiClient.post<CashSession>("/cash-management/session/open", payload);
  },
  closeSession(id: number, payload: { actualClosingBalance: number; notes?: string }) {
    return apiClient.post<{
      session: CashSession;
      snapshot: CashSessionSnapshot;
      discrepancy: number;
    }>(`/cash-management/session/${id}/close`, payload);
  },
  listTransactions(filters?: { cashSessionId?: number; from?: string; to?: string }) {
    return apiClient.get<CashTransaction[]>(
      withQuery("/cash-management/transactions", {
        cashSessionId: filters?.cashSessionId,
        from: filters?.from,
        to: filters?.to,
      }),
    );
  },
  createTransaction(payload: {
    type: "in" | "out";
    amount: number;
    category?: string;
    notes?: string;
    cashSessionId?: number;
  }) {
    return apiClient.post<CashTransaction | ApprovalPendingResponse>(
      "/cash-management/transactions",
      payload,
    );
  },
  paymentMethodReport(filters?: { from?: string; to?: string }) {
    return apiClient.get<PaymentMethodReportItem[]>(
      withQuery("/cash-management/report/payment-method", {
        from: filters?.from,
        to: filters?.to,
      }),
    );
  },
  pendingPayments(filters?: { from?: string; to?: string }) {
    return apiClient.get<PendingInvoicePayment[]>(
      withQuery("/cash-management/pending-payments", {
        from: filters?.from,
        to: filters?.to,
      }),
    );
  },
  confirmPayment(id: number, note?: string) {
    return apiClient.patch<InvoicePayment>(`/cash-management/payments/${id}/confirm`, { note });
  },
  failPayment(id: number, note?: string) {
    return apiClient.patch<InvoicePayment>(`/cash-management/payments/${id}/fail`, { note });
  },
};
