import { getServices, getServiceCategories } from "@/lib/queries/server-queries"
import { ServicesPageClient } from "./page-client"

export default async function ServicesPage() {
  // Server-side data fetching
  const [services, categories] = await Promise.all([
    getServices(),
    getServiceCategories()
  ])

  return (
    <ServicesPageClient 
      initialServices={services} 
      initialCategories={categories} 
    />
  )
}
