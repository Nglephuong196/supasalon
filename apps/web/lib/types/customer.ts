// Customer type based on database schema
export interface Customer {
  id: number
  name: string
  phone: string | null
  gender: string | null
  birthday: string | null
  location: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type CustomerUpdate = Partial<CustomerInsert>
