import { apiClient } from "@/lib/api";
import type { Customer } from "./customers.service";
import type { EmployeeMember } from "./employees.service";
import type { ProductItem } from "./products.service";
import type { ServiceItem } from "./services.service";

export type InvoiceStatus = "pending" | "paid" | "cancelled";

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

export type Invoice = {
  id: number;
  customerId?: number | null;
  bookingId?: number | null;
  subtotal: number;
  total: number;
  amountPaid?: number;
  status: InvoiceStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  isOpenInTab?: boolean;
  createdAt: string;
  customer?: Customer | null;
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
  subtotal: number;
  discountValue?: number;
  discountType?: "percent" | "fixed";
  total: number;
  amountPaid?: number;
  status?: InvoiceStatus;
  paymentMethod?: string;
  notes?: string;
  isOpenInTab?: boolean;
  items?: InvoiceItemPayload[];
};

export type InvoiceDependencies = {
  customers: Customer[];
  staff: EmployeeMember[];
  services: ServiceItem[];
  products: ProductItem[];
};

export const invoicesService = {
  list() {
    return apiClient.get<Invoice[]>("/invoices");
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
    ]).then(([customers, staff, services, products]) => ({
      customers,
      staff,
      services,
      products,
    }));
  },
  create(payload: InvoicePayload) {
    return apiClient.post<Invoice>("/invoices", payload);
  },
  update(id: number, payload: Partial<InvoicePayload>) {
    return apiClient.put<Invoice>(`/invoices/${id}`, payload);
  },
  close(id: number) {
    return apiClient.post<Invoice>(`/invoices/${id}/close`);
  },
  remove(id: number) {
    return apiClient.delete<{ message: string }>(`/invoices/${id}`);
  },
};
