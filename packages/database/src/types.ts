// Simple, clean type definitions for the salon-pro database
// These match the database schema but are much easier to read and use

// === SALON & USER TYPES ===

export interface Salon {
  id: string;
  name: string;
  province: string;
  address: string;
  phone: string;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export type SalonRole = "owner" | "manager" | "employee";

export interface SalonMember {
  id: string;
  salon_id: string;
  user_id: string;
  role: SalonRole;
  created_at: string | null;
}

// === CUSTOMER ===

export interface Customer {
  id: number;
  salon_id: string | null;
  name: string;
  phone: string | null;
  gender: string | null;
  birthday: string | null;
  location: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export type CustomerInsert = Omit<
  Customer,
  "id" | "created_at" | "updated_at" | "deleted_at" | "salon_id"
>;
export type CustomerUpdate = Partial<CustomerInsert>;

// === SERVICE CATEGORY ===

export interface ServiceCategory {
  id: string;
  salon_id: string | null;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export type ServiceCategoryInsert = Omit<
  ServiceCategory,
  "id" | "created_at" | "updated_at" | "salon_id"
>;
export type ServiceCategoryUpdate = Partial<ServiceCategoryInsert>;

// === SERVICE ===

export interface ExtraPrice {
  name: string;
  price: number;
}

export interface AttachedProduct {
  productId: string;
  quantity: number;
}

export interface Service {
  id: string;
  salon_id: string | null;
  category_id: string | null;
  name: string;
  price: number;
  duration: number | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  allow_booking: boolean | null;
  show_on_app: boolean | null;
  extra_price_config: ExtraPrice[] | null;
  attached_products_config: AttachedProduct[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ServiceInsert = Omit<Service, "id" | "created_at" | "updated_at" | "salon_id">;
export type ServiceUpdate = Partial<ServiceInsert>;
