import { apiClient } from "@/lib/api";
import type { BranchItem } from "./branches.service";
import type { Customer } from "./customers.service";
import type { EmployeeMember } from "./employees.service";
import type { ProductItem } from "./products.service";
import type { ServiceItem } from "./services.service";

export type InvoiceStatus = "pending" | "paid" | "cancelled" | "refunded";
export type InvoicePaymentMethod = "cash" | "card" | "transfer";
export type InvoicePaymentStatus = "pending" | "confirmed" | "failed" | "cancelled";
export type InvoicePaymentKind = "payment" | "refund";

export type InvoiceItemStaff = {
  staffId: string;
  role?: string;
  commissionValue?: number;
  commissionType?: "percent" | "fixed";
  bonus?: number;
};

export type InvoiceItemPayload = {
  type: "service" | "product";
  referenceId?: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  discountValue?: number;
  discountType?: "percent" | "fixed";
  total: number;
  staff: InvoiceItemStaff[];
};

export type InvoicePaymentInput = {
  method: InvoicePaymentMethod;
  amount: number;
  status?: InvoicePaymentStatus;
  referenceCode?: string;
  notes?: string;
};

export type InvoicePayment = {
  id: number;
  invoiceId: number;
  cashSessionId?: number | null;
  kind: InvoicePaymentKind;
  method: InvoicePaymentMethod;
  status: InvoicePaymentStatus;
  amount: number;
  referenceCode?: string | null;
  notes?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
};

export type Invoice = {
  id: number;
  customerId?: number | null;
  bookingId?: number | null;
  branchId?: number | null;
  branch?: BranchItem | null;
  subtotal: number;
  total: number;
  amountPaid?: number;
  change?: number;
  status: InvoiceStatus;
  paymentMethod?: "cash" | "card" | "transfer" | "mixed" | null;
  notes?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  refundReason?: string | null;
  refundedAt?: string | null;
  isOpenInTab?: boolean;
  createdAt: string;
  customer?: Customer | null;
  payments?: InvoicePayment[];
  items?: Array<{
    id: number;
    type: "service" | "product";
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type InvoicePayload = {
  customerId?: number;
  bookingId?: number;
  branchId?: number;
  subtotal: number;
  discountValue?: number;
  discountType?: "percent" | "fixed";
  total: number;
  amountPaid?: number;
  status?: InvoiceStatus;
  paymentMethod?: "cash" | "card" | "transfer" | "mixed";
  notes?: string;
  cancelReason?: string;
  refundReason?: string;
  isOpenInTab?: boolean;
  items?: InvoiceItemPayload[];
};

export type InvoiceSettlePayload = {
  payments: InvoicePaymentInput[];
  notes?: string;
};

export type InvoiceRefundPayload = {
  reason?: string;
  amount?: number;
  allocations?: InvoicePaymentInput[];
};

export type ApprovalPendingResponse = {
  requiresApproval: true;
  approvalRequest: {
    id: number;
    action: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
  };
};

export type InvoiceAuditLog = {
  id: number;
  action: string;
  reason?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type InvoiceDependencies = {
  customers: Customer[];
  staff: EmployeeMember[];
  services: ServiceItem[];
  products: ProductItem[];
  branches: BranchItem[];
};

export const invoicesService = {
  async list(filters?: { branchId?: number }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.set("branchId", String(filters.branchId));
    const query = params.toString();
    const result = await apiClient.get<{ data: Invoice[] }>(query ? `/invoices?${query}` : "/invoices");
    return result.data;
  },
  listOpenToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    return apiClient
      .get<{ data: Invoice[] }>(
        `/invoices?isOpenInTab=true&from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`,
      )
      .then((result) => result.data);
  },
  listDependencies() {
    return Promise.all([
      apiClient.get<{ data: Customer[] }>("/customers?page=1&limit=200").then((result) => result.data),
      Promise.resolve([] as EmployeeMember[]),
      Promise.resolve([] as ServiceItem[]),
      Promise.resolve([] as ProductItem[]),
      Promise.resolve([] as BranchItem[]),
    ]).then(([customers, staff, services, products, branches]) => ({
      customers,
      staff,
      services,
      products,
      branches,
    }));
  },
  create(payload: InvoicePayload) {
    return apiClient.post<Invoice>("/invoices", payload);
  },
  async update(_: number, __: Partial<InvoicePayload>): Promise<Invoice> {
    throw new Error("Invoice update endpoint is not available in apps/api yet.");
  },
  async settle(id: number, payload: InvoiceSettlePayload) {
    if (!payload.payments.length) {
      throw new Error("At least one payment is required.");
    }

    let latestInvoice: Invoice | null = null;
    for (const payment of payload.payments) {
      latestInvoice = await apiClient.post<Invoice>(`/invoices/${id}/payments`, {
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        referenceCode: payment.referenceCode,
        notes: payment.notes ?? payload.notes,
      });
    }

    return latestInvoice as Invoice;
  },
  async payments(_: number): Promise<InvoicePayment[]> {
    throw new Error("Invoice payment list endpoint is not available in apps/api yet.");
  },
  async close(_: number): Promise<Invoice> {
    throw new Error("Invoice close endpoint is not available in apps/api yet.");
  },
  async cancel(_: number, __?: string): Promise<Invoice | ApprovalPendingResponse> {
    throw new Error("Invoice cancel endpoint is not available in apps/api yet.");
  },
  async refund(_: number, __?: string | InvoiceRefundPayload): Promise<Invoice | ApprovalPendingResponse> {
    throw new Error("Invoice refund endpoint is not available in apps/api yet.");
  },
  async audit(_: number): Promise<InvoiceAuditLog[]> {
    throw new Error("Invoice audit endpoint is not available in apps/api yet.");
  },
  async remove(_: number): Promise<{ message: string }> {
    throw new Error("Invoice delete endpoint is not available in apps/api yet.");
  },
};
