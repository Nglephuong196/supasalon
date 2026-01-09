import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types/customer'
import { toast } from 'sonner'

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

      let query = supabase
        .from('customer')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to)

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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    staleTime: 1000 * 60 * 2,
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
    staleTime: 1000 * 60 * 5, // 5 minutes for individual customer
  })
}

// Create customer with optimistic updates
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
    onMutate: async (newCustomer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.all })
      
      // Show loading toast
      toast.loading('Đang thêm khách hàng...', { id: 'create-customer' })

      return { newCustomer }
    },
    onSuccess: (data) => {
      // Update cache with the new customer
      queryClient.setQueryData<Customer[]>(customerKeys.all, (old) => 
        old ? [data, ...old] : [data]
      )
      
      // Invalidate paginated queries to refetch with correct counts
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      
      toast.success(`Đã thêm khách hàng "${data.name}"`, { id: 'create-customer' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-customer' })
    },
  })
}

// Update customer with optimistic updates
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.detail(variables.id) })
      
      // Snapshot the previous value
      const previousCustomer = queryClient.getQueryData<Customer>(customerKeys.detail(variables.id))
      
      // Optimistically update the cache
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(customerKeys.detail(variables.id), {
          ...previousCustomer,
          ...variables,
        })
      }
      
      toast.loading('Đang cập nhật...', { id: 'update-customer' })

      return { previousCustomer }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData<Customer>(customerKeys.detail(data.id), data)
      
      // Invalidate list queries to update the table
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      
      toast.success(`Đã cập nhật khách hàng "${data.name}"`, { id: 'update-customer' })
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousCustomer) {
        queryClient.setQueryData<Customer>(
          customerKeys.detail(variables.id), 
          context.previousCustomer
        )
      }
      
      toast.error(`Lỗi: ${error.message}`, { id: 'update-customer' })
    },
  })
}

// Delete customer with optimistic updates
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('customer')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: customerKeys.all })
      
      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData<Customer[]>(customerKeys.all)
      
      // Optimistically remove from cache
      queryClient.setQueryData<Customer[]>(customerKeys.all, (old) => 
        old?.filter(c => c.id !== id) ?? []
      )
      
      toast.loading('Đang xóa...', { id: 'delete-customer' })

      return { previousCustomers }
    },
    onSuccess: () => {
      // Invalidate all customer queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      
      toast.success('Đã xóa khách hàng', { id: 'delete-customer' })
    },
    onError: (error: Error, _id, context) => {
      // Rollback to previous value on error
      if (context?.previousCustomers) {
        queryClient.setQueryData<Customer[]>(customerKeys.all, context.previousCustomers)
      }
      
      toast.error(`Lỗi: ${error.message}`, { id: 'delete-customer' })
    },
  })
}
