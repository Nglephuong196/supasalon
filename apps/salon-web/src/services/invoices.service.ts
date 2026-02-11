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
  organizationId: string;
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
  list(filters?: { branchId?: number }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.set("branchId", String(filters.branchId));
    const query = params.toString();
    return apiClient.get<Invoice[]>(query ? `/invoices?${query}` : "/invoices");
  },
  listOpenToday() {
    return apiClient.get<Invoice[]>("/invoices?isOpenInTab=true&date=today");
  },
  listDependencies() {
    return Promise.all([
      apiClient.get<Customer[]>("/customers"),
      apiClient.get<EmployeeMember[]>("/members"),
      apiClient.get<ServiceItem[]>("/services"),
      apiClient.get<ProductItem[]>("/products"),
      apiClient.get<BranchItem[]>("/branches"),
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
  update(id: number, payload: Partial<InvoicePayload>) {
    return apiClient.put<Invoice>(`/invoices/${id}`, payload);
  },
  settle(id: number, payload: InvoiceSettlePayload) {
    return apiClient.post<Invoice>(`/invoices/${id}/settle`, payload);
  },
  payments(id: number) {
    return apiClient.get<InvoicePayment[]>(`/invoices/${id}/payments`);
  },
  close(id: number) {
    return apiClient.post<Invoice>(`/invoices/${id}/close`);
  },
  cancel(id: number, reason?: string) {
    return apiClient.post<Invoice | ApprovalPendingResponse>(`/invoices/${id}/cancel`, { reason });
  },
  refund(id: number, payload?: string | InvoiceRefundPayload) {
    const body = typeof payload === "string" ? { reason: payload } : payload ?? {};
    return apiClient.post<Invoice | ApprovalPendingResponse>(`/invoices/${id}/refund`, body);
  },
  audit(id: number) {
    return apiClient.get<InvoiceAuditLog[]>(`/invoices/${id}/audit`);
  },
  remove(id: number) {
    return apiClient.delete<{ message: string }>(`/invoices/${id}`);
  },
};
