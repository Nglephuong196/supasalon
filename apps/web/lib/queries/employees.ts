import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Employee, EmployeeInsert, EmployeeUpdate, EmployeeGroup, EmployeeGroupInsert, EmployeeGroupUpdate } from "@/lib/types/employee"
import { toast } from "sonner"

const supabase = createClient()

// ============================================================
// QUERY KEYS
// ============================================================
export const employeeKeys = {
  all: ["employees"] as const,
  groups: ["employee-groups"] as const,
}

// ============================================================
// EMPLOYEE GROUPS HOOKS
// ============================================================

export function useEmployeeGroups() {
  return useQuery({
    queryKey: employeeKeys.groups,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_groups")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return data as EmployeeGroup[]
    },
  })
}

export function useCreateEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (group: EmployeeGroupInsert) => {
      const { data, error } = await supabase
        .from("employee_groups")
        .insert(group)
        .select()
        .single()

      if (error) throw error
      return data as EmployeeGroup
    },
    onSuccess: (data) => {
      queryClient.setQueryData<EmployeeGroup[]>(employeeKeys.groups, (old) =>
        old ? [...old, data].sort((a, b) => a.name.localeCompare(b.name)) : [data]
      )
      toast.success(`Đã tạo nhóm "${data.name}"`)
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useUpdateEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (group: EmployeeGroupUpdate) => {
      const { data, error } = await supabase
        .from("employee_groups")
        .update({ name: group.name })
        .eq("id", group.id)
        .select()
        .single()

      if (error) throw error
      return data as EmployeeGroup
    },
    onSuccess: (data) => {
      queryClient.setQueryData<EmployeeGroup[]>(employeeKeys.groups, (old) =>
        old?.map((g) => (g.id === data.id ? data : g))
      )
      toast.success(`Đã cập nhật nhóm "${data.name}"`)
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useDeleteEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_groups")
        .delete()
        .eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<EmployeeGroup[]>(employeeKeys.groups, (old) =>
        old?.filter((g) => g.id !== id)
      )
      toast.success("Đã xóa nhóm")
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

// ============================================================
// EMPLOYEES HOOKS
// ============================================================

export function useEmployees(groupId?: string) {
  return useQuery({
    queryKey: groupId ? [...employeeKeys.all, groupId] : employeeKeys.all,
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("*")
        .order("name", { ascending: true })

      if (groupId) {
        query = query.eq("group_id", groupId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Employee[]
    },
  })
}

interface CreateEmployeeWithPassword extends EmployeeInsert {
  password: string
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee: CreateEmployeeWithPassword) => {
      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Bạn chưa đăng nhập")
      }

      // Call edge function to create employee with auth user
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-employee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(employee),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create employee')
      }

      return result.employee as Employee
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success(`Đã thêm nhân viên "${data.name}"`)
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee: EmployeeUpdate) => {
      const { id, ...updateData } = employee
      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Employee
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success(`Đã cập nhật nhân viên "${data.name}"`)
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success("Đã xóa nhân viên")
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}
