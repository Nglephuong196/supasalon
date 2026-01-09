import { getEmployees, getEmployeeGroups } from "@/lib/queries/server-queries"
import { EmployeesPageClient } from "./page-client"

export default async function EmployeesPage() {
  // Server-side data fetching
  const [employees, groups] = await Promise.all([
    getEmployees(),
    getEmployeeGroups()
  ])

  return (
    <EmployeesPageClient 
      initialEmployees={employees} 
      initialGroups={groups} 
    />
  )
}
