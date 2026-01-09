"use client"

import { useState } from "react"
import { CategorySidebar, Category } from "@/components/resource/category-sidebar"
import { MobileCategorySelector } from "@/components/resource/mobile-category-selector"
import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { EmployeeForm } from "./employee-form"
import { EmployeeFormValues } from "./schema"
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useEmployeeGroups,
  useCreateEmployeeGroup,
  useUpdateEmployeeGroup,
  useDeleteEmployeeGroup,
} from "@/lib/queries/employees"
import type { Employee, EmployeeGroup } from "@/lib/types/employee"

interface EmployeesPageClientProps {
  initialEmployees: Employee[]
  initialGroups: EmployeeGroup[]
}

export function EmployeesPageClient({ initialEmployees, initialGroups }: EmployeesPageClientProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // TanStack Query hooks - use initial data from server
  const { data: groups = initialGroups, isLoading: groupsLoading } = useEmployeeGroups()
  const { data: employees = initialEmployees, isLoading: employeesLoading } = useEmployees(selectedGroupId || undefined)

  // Mutations
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const createGroup = useCreateEmployeeGroup()
  const updateGroup = useUpdateEmployeeGroup()
  const deleteGroup = useDeleteEmployeeGroup()

  // Group Handlers
  const handleAddGroup = async (name: string) => {
    await createGroup.mutateAsync({ name })
  }

  const handleEditGroup = async (id: string, name: string) => {
    await updateGroup.mutateAsync({ id, name })
  }

  const handleDeleteGroup = async (id: string) => {
    await deleteGroup.mutateAsync(id)
    if (selectedGroupId === id) {
      setSelectedGroupId(null)
    }
  }

  // Employee Handlers
  const handleCreateEmployee = async (data: EmployeeFormValues) => {
    if (!data.password) {
      throw new Error("Mật khẩu là bắt buộc khi tạo nhân viên mới")
    }
    await createEmployee.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
      group_id: data.group_id || null,
      status: data.status,
      avatar_url: data.avatar_url || null,
      allow_booking: data.allow_booking,
      allow_overlap: data.allow_overlap,
      birthday: data.birthday || null,
      phone: data.phone || null,
    })
    return true
  }

  const handleUpdateEmployee = async (data: EmployeeFormValues) => {
    if (!data.id) return false
    await updateEmployee.mutateAsync({
      id: data.id,
      name: data.name,
      email: data.email,
      group_id: data.group_id || null,
      status: data.status,
      avatar_url: data.avatar_url || null,
      allow_booking: data.allow_booking,
      allow_overlap: data.allow_overlap,
      birthday: data.birthday || null,
      phone: data.phone || null,
    })
    return true
  }

  const handleDeleteEmployee = async (employee: EmployeeFormValues) => {
    if (!employee.id) return
    await deleteEmployee.mutateAsync(employee.id)
  }

  // Map to form values for table (include id for edit/delete)
  const formattedEmployees: EmployeeFormValues[] = employees.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email || "",
    group_id: e.group_id || "",
    status: e.status || "active",
    avatar_url: e.avatar_url,
    allow_booking: e.allow_booking,
    allow_overlap: e.allow_overlap,
    birthday: e.birthday,
    phone: e.phone,
  }))

  // Map groups for sidebar
  const sidebarGroups: Category[] = groups.map(g => ({
    id: g.id,
    name: g.name
  }))

  const isLoading = groupsLoading || employeesLoading

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Desktop Sidebar */}
      <CategorySidebar
        title="Nhóm nhân viên"
        categories={sidebarGroups}
        selectedId={selectedGroupId}
        onSelect={setSelectedGroupId}
        onAdd={handleAddGroup}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Group Selector */}
        <div className="p-4 md:hidden">
          <MobileCategorySelector
            title="Nhóm nhân viên"
            categories={sidebarGroups}
            selectedId={selectedGroupId}
            onSelect={setSelectedGroupId}
            onAdd={handleAddGroup}
            onEdit={handleEditGroup}
            onDelete={handleDeleteGroup}
          />
        </div>

        <ResourcePage<EmployeeFormValues>
          key={selectedGroupId || "all"}
          title={selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name || "Nhân viên" : "Tất cả nhân viên"}
          initialData={formattedEmployees}
          searchKey="name"
          addButtonLabel="Thêm nhân viên"
          getColumns={(actions) => getColumns({
            onEdit: actions.onEdit as unknown as (item: Employee) => void,
            onDelete: actions.onDelete as unknown as (item: Employee) => void,
            groups
          }) as any}
          FormComponent={(props) => <EmployeeForm {...props} groups={groups} />}
          onAdd={handleCreateEmployee}
          onEdit={handleUpdateEmployee}
          onDelete={handleDeleteEmployee}
          dialogTitle={(isEditing) => isEditing ? "Sửa nhân viên" : "Tạo mới nhân viên"}
          dialogDescription="Nhập thông tin nhân viên vào form bên dưới."
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
