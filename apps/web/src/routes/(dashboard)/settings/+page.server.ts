import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";

const API_URL = "http://localhost:8787";

export type MembershipTier = {
  id: number;
  organizationId: string;
  name: string;
  minSpending: number;
  discountPercent: number;
  minSpendingToMaintain: number | null;
  sortOrder: number;
  createdAt: string;
};

export type MemberPermission = {
  id: number;
  memberId: string;
  permissions: Record<string, string[]>;
  createdAt: string;
};

export type Member = {
  id: string;
  role: string;
  createdAt?: string;
  organizationId?: string;
  userId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  permissions: MemberPermission[];
};

export type Service = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

export type Category = {
  id: number;
  name: string;
};

export type CommissionRule = {
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

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const organizationId = cookies.get("organizationId");

  if (!organizationId) {
    return {
      tiers: [],
      members: [],
      services: [],
      products: [],
      serviceCategories: [],
      productCategories: [],
      commissionRules: [],
    };
  }

  // handleFetch automatically injects cookies and X-Organization-Id
  try {
    const [
      tiersRes,
      membersRes,
      servicesRes,
      productsRes,
      serviceCategoriesRes,
      productCategoriesRes,
      commissionRulesRes,
    ] = await Promise.all([
      fetch(`${API_URL}/membership-tiers`),
      fetch(`${API_URL}/members`),
      fetch(`${API_URL}/services`),
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/service-categories`),
      fetch(`${API_URL}/product-categories`),
      fetch(`${API_URL}/staff-commission-rules`),
    ]);

    const tiers: MembershipTier[] = tiersRes.ok ? await tiersRes.json() : [];
    const members: Member[] = membersRes.ok ? await membersRes.json() : [];
    const services: Service[] = servicesRes.ok ? await servicesRes.json() : [];
    const products: Product[] = productsRes.ok ? await productsRes.json() : [];
    const serviceCategories: Category[] = serviceCategoriesRes.ok
      ? await serviceCategoriesRes.json()
      : [];
    const productCategories: Category[] = productCategoriesRes.ok
      ? await productCategoriesRes.json()
      : [];
    const commissionRules: CommissionRule[] = commissionRulesRes.ok
      ? await commissionRulesRes.json()
      : [];

    return {
      tiers,
      members,
      services,
      products,
      serviceCategories,
      productCategories,
      commissionRules,
    };
  } catch (error) {
    console.error("Failed to load settings data:", error);
    return {
      tiers: [],
      members: [],
      services: [],
      products: [],
      serviceCategories: [],
      productCategories: [],
      commissionRules: [],
    };
  }
};

export const actions: Actions = {
  updatePermissions: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const memberId = data.get("memberId") as string;
    if (!memberId) return fail(400, { missing: true });

    // Parse permissions from form data
    const permissions: Record<string, string[]> = {};
    for (const [key, value] of data.entries()) {
      if (key.startsWith("permissions[")) {
        const match = key.match(/permissions\[([^\]]+)\]\[([^\]]+)\]/);
        if (match && value === "on") {
          const [, resource, action] = match;
          if (!permissions[resource]) permissions[resource] = [];
          permissions[resource].push(action);
        }
      }
    }

    try {
      const response = await fetch(`${API_URL}/members/${memberId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể cập nhật quyền",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },
};
