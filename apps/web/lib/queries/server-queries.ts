import { createClient } from "@/lib/supabase/server"
import type { Customer } from "@/lib/types/customer"
import type { Service } from "@/lib/types/service"
import type { ServiceCategory } from "@/lib/types/service-category"

/**
 * Server-side data fetching functions for SSR
 * These are used in Server Components to fetch initial data
 */

// ============================================================
// CUSTOMERS
// ============================================================

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("customer")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
    return []
  }

  return data as Customer[]
}

export async function getCustomersPaginated(
  page: number = 1,
  pageSize: number = 10,
  search?: string
) {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("customer")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search?.trim()) {
    query = query.ilike("name", `%${search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching customers:", error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: data as Customer[],
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============================================================
// SERVICE CATEGORIES
// ============================================================

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching service categories:", error)
    return []
  }

  return data as ServiceCategory[]
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices(categoryId?: string): Promise<Service[]> {
  const supabase = await createClient()

  let query = supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true })

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return data as Service[]
}

// ============================================================
// EMPLOYEES
// ============================================================

import type { Employee, EmployeeGroup } from "@/lib/types/employee"

export async function getEmployees(groupId?: string): Promise<Employee[]> {
  const supabase = await createClient()

  let query = supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true })

  if (groupId) {
    query = query.eq("group_id", groupId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching employees:", error)
    return []
  }

  return data as Employee[]
}

export async function getEmployeeGroups(): Promise<EmployeeGroup[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("employee_groups")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching employee groups:", error)
    return []
  }

  return data as EmployeeGroup[]
}

