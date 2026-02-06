export interface MembershipTier {
  id: number;
  organizationId: string;
  name: string;
  minSpending: number;
  discountPercent: number;
  minSpendingToMaintain: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface Customer {
  id: number;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  location: string | null;
  birthday: string | null;
  notes: string | null;
  totalSpent: number;
  membershipTierId: number | null;
  membershipTier?: MembershipTier | null;
  createdAt: string; // serialized Date
}

export type NewCustomer = Omit<
  Customer,
  "id" | "createdAt" | "organizationId" | "totalSpent" | "membershipTierId" | "membershipTier"
>;

export interface ServiceCategory {
  id: number;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  createdAt: string;
}

export interface Booking {
  id: number;
  organizationId: string;
  customerId: number;
  serviceId: number;
  date: string; // serialized Date
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
  customer?: Customer;
  service?: Service;
}

export type NewBooking = Omit<Booking, "id" | "createdAt" | "organizationId">;

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  type: "service" | "product" | "package" | "other";
  referenceId?: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  discountValue?: number | null;
  discountType?: "percent" | "fixed" | null;
  total: number;
}

export interface Invoice {
  id: number;
  organizationId: string;
  customerId?: number | null;
  bookingId?: number | null;
  subtotal: number;
  discountValue?: number | null;
  discountType?: "percent" | "fixed" | null;
  total: number;
  amountPaid?: number | null;
  change?: number | null;
  status: "pending" | "paid" | "cancelled" | "refunded";
  paymentMethod?: "cash" | "card" | "transfer" | null;
  notes?: string | null;
  paidAt?: string | null;
  isOpenInTab?: boolean;
  createdAt: string;
  booking?: Booking;
  customer?: Customer;
  items?: InvoiceItem[];
}
