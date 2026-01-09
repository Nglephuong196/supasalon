import { getCustomersPaginated } from "@/lib/queries/server-queries"
import { CustomersPageClient } from "./page-client"

export default async function CustomersPage() {
  // Server-side data fetching
  const initialData = await getCustomersPaginated(1, 10)

  return <CustomersPageClient initialData={initialData} />
}
