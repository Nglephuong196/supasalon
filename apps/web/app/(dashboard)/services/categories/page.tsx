import { getServiceCategories } from "@/lib/queries/server-queries"
import { ServiceCategoriesPageClient } from "./page-client"

export default async function ServiceCategoriesPage() {
  // Server-side data fetching
  const categories = await getServiceCategories()

  return <ServiceCategoriesPageClient initialData={categories} />
}
