import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types/customer'

const supabase = createClient()

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  list: (page: number, pageSize: number, search?: string) => [...customerKeys.all, 'list', { page, pageSize, search }] as const,
  count: (search?: string) => [...customerKeys.all, 'count', { search }] as const,
  detail: (id: number) => [...customerKeys.all, id] as const,
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Fetch paginated customers
export function useCustomersPaginated(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: customerKeys.list(page, pageSize, search),
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Build the query
      let query = supabase
        .from('customer')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to)

      // Add search filter if provided
      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data as Customer[],
        total,
        page,
        pageSize,
        totalPages,
      }
    },
  })
}

// Fetch all customers (for backward compatibility)
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Customer[]
    },
  })
}

// Fetch single customer
export function useCustomer(id: number) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Customer
    },
    enabled: !!id,
  })
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customer')
        .insert(customer)
        .select()
        .single()

      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from('customer')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Customer
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
    },
  })
}

// Delete customer (soft delete)
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('customer')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
