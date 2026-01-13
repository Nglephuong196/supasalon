export interface Customer {
    id: number;
    organizationId: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: string; // serialized Date
}

export type NewCustomer = Omit<Customer, "id" | "createdAt" | "organizationId">;

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

export interface Invoice {
    id: number;
    bookingId: number;
    amount: number;
    status: "pending" | "paid" | "cancelled";
    paidAt: string | null;
    createdAt: string;
    booking?: Booking;
}
