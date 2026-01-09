// ServiceCategory type based on database schema (002_create_services_tables.sql)
export interface ServiceCategory {
  id: string  // UUID
  salon_id: string | null  // Auto-set by database trigger
  name: string
  created_at: string | null
  updated_at: string | null
}

// salon_id is auto-set by trigger, don't include in insert
export type ServiceCategoryInsert = Omit<ServiceCategory, 'id' | 'salon_id' | 'created_at' | 'updated_at'>
export type ServiceCategoryUpdate = Partial<ServiceCategoryInsert>
