export interface EmployeeGroup {
  id: string
  salon_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  salon_id: string
  name: string
  email: string | null
  user_id: string | null
  group_id: string | null
  status: 'active' | 'inactive'
  avatar_url: string | null
  allow_booking: boolean
  allow_overlap: boolean
  birthday: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export type EmployeeGroupInsert = Pick<EmployeeGroup, 'name'> & Partial<Pick<EmployeeGroup, 'salon_id'>>
export type EmployeeGroupUpdate = Partial<EmployeeGroupInsert> & { id: string }

export type EmployeeInsert = Pick<Employee, 'name'> & Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>
export type EmployeeUpdate = Partial<EmployeeInsert> & { id: string }
