// Customer type based on database schema
export interface Customer {
  id: number
  salon_id: string | null  // Auto-set by database trigger
  name: string
  phone: string | null
  gender: string | null
  birthday: string | null
  location: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

// salon_id is auto-set by trigger, don't include in insert
export type CustomerInsert = Omit<Customer, 'id' | 'salon_id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type CustomerUpdate = Partial<CustomerInsert>


