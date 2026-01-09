// Service type based on database schema (002_create_services_tables.sql)

// Extra price configuration item
export interface ExtraPriceConfig {
  name: string
  price: number
}

// Attached product configuration item
export interface AttachedProductConfig {
  product_id: string
  quantity: number
}

export interface Service {
  id: string  // UUID
  salon_id: string | null  // Auto-set by database trigger
  category_id: string | null  // References service_categories
  name: string
  price: number
  duration: number | null  // in minutes
  is_active: boolean
  description: string | null
  image_url: string | null
  extra_price_config: ExtraPriceConfig[]  // JSONB "Đơn giá phụ"
  attached_products_config: AttachedProductConfig[]  // JSONB "Sản phẩm đi kèm"
  allow_booking: boolean
  show_on_app: boolean
  created_at: string | null
  updated_at: string | null
}

// salon_id is auto-set by trigger, don't include in insert
export type ServiceInsert = Omit<Service, 'id' | 'salon_id' | 'created_at' | 'updated_at'>
export type ServiceUpdate = Partial<ServiceInsert>
