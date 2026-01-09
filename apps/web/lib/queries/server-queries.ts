import type { Customer } from "@/lib/types/customer"
import type { Service } from "@/lib/types/service"
import type { ServiceCategory } from "@/lib/types/service-category"
import type { Employee, EmployeeGroup } from "@/lib/types/employee"

/**
 * Server-side data fetching functions for SSR
 * TODO: Replace with new backend API calls
 */

// ============================================================
// CUSTOMERS
// ============================================================

export async function getCustomers(): Promise<Customer[]> {
  // TODO: Implement with new backend
  console.warn('getCustomers: Not implemented - awaiting new backend')
  return []
}

export async function getCustomersPaginated(
  page: number = 1,
  pageSize: number = 10,
  search?: string
) {
  // TODO: Implement with new backend
  console.warn('getCustomersPaginated: Not implemented - awaiting new backend')
  return { data: [], total: 0, page, pageSize, totalPages: 0 }
}

// ============================================================
// SERVICE CATEGORIES
// ============================================================

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  // TODO: Implement with new backend
  console.warn('getServiceCategories: Not implemented - awaiting new backend')
  return []
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices(categoryId?: string): Promise<Service[]> {
  // TODO: Implement with new backend
  console.warn('getServices: Not implemented - awaiting new backend')
  return []
}

// ============================================================
// EMPLOYEES
// ============================================================

export async function getEmployees(groupId?: string): Promise<Employee[]> {
  // TODO: Implement with new backend
  console.warn('getEmployees: Not implemented - awaiting new backend')
  return []
}

export async function getEmployeeGroups(): Promise<EmployeeGroup[]> {
  // TODO: Implement with new backend
  console.warn('getEmployeeGroups: Not implemented - awaiting new backend')
  return []
}
