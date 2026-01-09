import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Employee, EmployeeInsert, EmployeeUpdate, EmployeeGroup, EmployeeGroupInsert, EmployeeGroupUpdate } from "@/lib/types/employee"
import { toast } from "sonner"

// TODO: Replace with new backend API calls

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
      // TODO: Implement with new backend
      console.warn('useEmployeeGroups: Not implemented - awaiting new backend')
      return [] as EmployeeGroup[]
    },
  })
}

export function useCreateEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (group: EmployeeGroupInsert) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: (data: EmployeeGroup) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.groups })
      toast.success(`Đã tạo nhóm "${data.name}"`)
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useUpdateEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (group: EmployeeGroupUpdate) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: (data: EmployeeGroup) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.groups })
      toast.success(`Đã cập nhật nhóm "${data.name}"`)
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useDeleteEmployeeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.groups })
      toast.success("Đã xóa nhóm")
    },
    onError: (error: Error) => {
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
      // TODO: Implement with new backend
      console.warn('useEmployees: Not implemented - awaiting new backend')
      return [] as Employee[]
    },
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee: EmployeeInsert & { password?: string }) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: (data: Employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success(`Đã thêm nhân viên "${data.name}"`)
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee: EmployeeUpdate) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: (data: Employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success(`Đã cập nhật nhân viên "${data.name}"`)
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success("Đã xóa nhân viên")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}
