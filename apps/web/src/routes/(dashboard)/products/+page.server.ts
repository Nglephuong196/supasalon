import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermission, getResourcePermissions } from "$lib/permissions";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const organizationId = cookies.get("organizationId");
  const { memberRole, memberPermissions } = await parent();

  // Check read permission - redirect if denied
  if (!checkPermission(memberRole, memberPermissions, RESOURCES.PRODUCT, ACTIONS.READ)) {
    throw redirect(302, "/unauthorized");
  }

  // Get permission flags for UI
  const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.PRODUCT);

  if (!organizationId) {
    return { products: [], categories: [], ...permissions };
  }

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${PUBLIC_API_URL}/products`),
      fetch(`${PUBLIC_API_URL}/product-categories`),
    ]);

    if (productsRes.status === 403 || categoriesRes.status === 403) {
      throw redirect(302, "/unauthorized");
    }

    const products = productsRes.ok ? await productsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];

    return { products, categories, ...permissions };
  } catch (e) {
    if ((e as any)?.status === 302) throw e;
    console.error("Error fetching products data", e);
    return { products: [], categories: [], ...permissions };
  }
};

export const actions: Actions = {
  createCategory: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { missing: true });

    try {
      const response = await fetch(`${PUBLIC_API_URL}/product-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể tạo danh mục",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  updateCategory: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    const name = data.get("name") as string;
    if (!id || !name) return fail(400, { missing: true });

    try {
      const response = await fetch(`${PUBLIC_API_URL}/product-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể cập nhật danh mục",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  deleteCategory: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { missing: true });

    try {
      const response = await fetch(`${PUBLIC_API_URL}/product-categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể xóa danh mục",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  createProduct: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const name = data.get("name") as string;
    const categoryId = parseInt(data.get("categoryId") as string);
    const price = parseFloat(data.get("price") as string);
    const stock = parseInt(data.get("stock") as string) || 0;
    const minStock = parseInt(data.get("minStock") as string) || 0;
    const sku = data.get("sku") as string;
    const description = data.get("description") as string;

    if (!name || name.trim() === "") {
      return fail(400, {
        missingName: true,
        message: "Vui lòng nhập tên sản phẩm",
      });
    }
    if (!categoryId || isNaN(categoryId)) {
      return fail(400, {
        missingCategory: true,
        message: "Vui lòng chọn danh mục",
      });
    }
    if (isNaN(price)) {
      return fail(400, {
        invalidPrice: true,
        message: "Giá sản phẩm không hợp lệ",
      });
    }

    try {
      const response = await fetch(`${PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          price,
          stock,
          minStock,
          sku: sku || null,
          description: description || "",
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể tạo sản phẩm",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  updateProduct: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    const name = data.get("name");
    const categoryId = data.get("categoryId")
      ? parseInt(data.get("categoryId") as string)
      : undefined;
    const price = data.get("price") ? parseFloat(data.get("price") as string) : undefined;
    const stock = data.get("stock") ? parseInt(data.get("stock") as string) : undefined;
    const minStock = data.get("minStock") ? parseInt(data.get("minStock") as string) : undefined;
    const sku = data.get("sku") as string | undefined;
    const description = data.get("description") as string;

    if (!id) return fail(400, { missing: true });

    const payload: any = {};
    if (name) payload.name = name;
    if (categoryId) payload.categoryId = categoryId;
    if (price !== undefined) payload.price = price;
    if (stock !== undefined) payload.stock = stock;
    if (minStock !== undefined) payload.minStock = minStock;
    if (sku !== undefined) payload.sku = sku || null;
    if (description !== undefined) payload.description = description;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể cập nhật sản phẩm",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  deleteProduct: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { missing: true });

    try {
      const response = await fetch(`${PUBLIC_API_URL}/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, {
          message: res.error || "Không thể xóa sản phẩm",
        });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },
};
