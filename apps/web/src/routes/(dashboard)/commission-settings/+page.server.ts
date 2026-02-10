import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermission, getResourcePermissions } from "$lib/permissions";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

type MemberRow = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type ServiceRow = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

type ProductRow = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

type CategoryRow = {
  id: number;
  name: string;
};

type CommissionRuleRow = {
  id: number;
  organizationId: string;
  staffId: string;
  itemType: "service" | "product";
  itemId: number;
  commissionType: "percent" | "fixed";
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
};

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const organizationId = cookies.get("organizationId");
  const { memberRole, memberPermissions } = await parent();

  if (!checkPermission(memberRole, memberPermissions, RESOURCES.EMPLOYEE, ACTIONS.READ)) {
    throw redirect(302, "/unauthorized");
  }

  const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.EMPLOYEE);

  if (!organizationId) {
    return {
      members: [],
      services: [],
      products: [],
      serviceCategories: [],
      productCategories: [],
      rules: [],
      ...permissions,
    };
  }

  try {
    const [
      membersRes,
      servicesRes,
      productsRes,
      serviceCategoriesRes,
      productCategoriesRes,
      rulesRes,
    ] = await Promise.all([
      fetch(`${PUBLIC_API_URL}/members`),
      fetch(`${PUBLIC_API_URL}/services`),
      fetch(`${PUBLIC_API_URL}/products`),
      fetch(`${PUBLIC_API_URL}/service-categories`),
      fetch(`${PUBLIC_API_URL}/product-categories`),
      fetch(`${PUBLIC_API_URL}/staff-commission-rules`),
    ]);

    if (
      membersRes.status === 403 ||
      servicesRes.status === 403 ||
      productsRes.status === 403 ||
      serviceCategoriesRes.status === 403 ||
      productCategoriesRes.status === 403 ||
      rulesRes.status === 403
    ) {
      throw redirect(302, "/unauthorized");
    }

    const members: MemberRow[] = membersRes.ok ? await membersRes.json() : [];
    const services: ServiceRow[] = servicesRes.ok ? await servicesRes.json() : [];
    const products: ProductRow[] = productsRes.ok ? await productsRes.json() : [];
    const serviceCategories: CategoryRow[] = serviceCategoriesRes.ok
      ? await serviceCategoriesRes.json()
      : [];
    const productCategories: CategoryRow[] = productCategoriesRes.ok
      ? await productCategoriesRes.json()
      : [];
    const rules: CommissionRuleRow[] = rulesRes.ok ? await rulesRes.json() : [];

    return {
      members,
      services,
      products,
      serviceCategories,
      productCategories,
      rules,
      ...permissions,
    };
  } catch (error: any) {
    if (error?.status === 302) throw error;

    console.error("Failed to load commission settings:", error);

    return {
      members: [],
      services: [],
      products: [],
      serviceCategories: [],
      productCategories: [],
      rules: [],
      ...permissions,
    };
  }
};
