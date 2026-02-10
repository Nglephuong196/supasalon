import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermission, getResourcePermissions } from "$lib/permissions";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const organizationId = cookies.get("organizationId");
  const { memberRole, memberPermissions } = await parent();

  // Check read permission - redirect if denied
  if (!checkPermission(memberRole, memberPermissions, RESOURCES.SERVICE, ACTIONS.READ)) {
    throw redirect(302, "/unauthorized");
  }

  // Get permission flags for UI
  const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.SERVICE);

  if (!organizationId) {
    return { services: [], categories: [], ...permissions };
  }

  // handleFetch automatically injects cookies and X-Organization-Id
  try {
    const [servicesRes, categoriesRes] = await Promise.all([
      fetch(`${PUBLIC_API_URL}/services`),
      fetch(`${PUBLIC_API_URL}/service-categories`),
    ]);

    if (servicesRes.status === 403 || categoriesRes.status === 403) {
      throw redirect(302, "/unauthorized");
    }

    const services = servicesRes.ok ? await servicesRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];

    return { services, categories, ...permissions };
  } catch (e) {
    if ((e as any)?.status === 302) throw e;
    console.error("Error fetching services data", e);
    return { services: [], categories: [], ...permissions };
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
      const response = await fetch(`${PUBLIC_API_URL}/service-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể tạo danh mục" });
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
      const response = await fetch(`${PUBLIC_API_URL}/service-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể cập nhật danh mục" });
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
      const response = await fetch(`${PUBLIC_API_URL}/service-categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể xóa danh mục" });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  createService: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const name = data.get("name") as string;
    const categoryId = parseInt(data.get("categoryId") as string);
    const price = parseFloat(data.get("price") as string);
    const duration = parseInt(data.get("duration") as string);
    const description = data.get("description") as string;

    if (!name || name.trim() === "") {
      return fail(400, { missingName: true, message: "Vui lòng nhập tên dịch vụ" });
    }
    if (!categoryId || isNaN(categoryId)) {
      return fail(400, {
        missingCategory: true,
        val: data.get("categoryId"),
        message: "Vui lòng chọn danh mục",
      });
    }
    if (isNaN(price)) {
      return fail(400, { invalidPrice: true, message: "Giá dịch vụ không hợp lệ" });
    }
    if (isNaN(duration)) {
      return fail(400, { invalidDuration: true, message: "Thời gian không hợp lệ" });
    }

    try {
      const response = await fetch(`${PUBLIC_API_URL}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId, price, duration, description: description || "" }),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể tạo dịch vụ" });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  updateService: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    const name = data.get("name");
    const categoryId = data.get("categoryId")
      ? parseInt(data.get("categoryId") as string)
      : undefined;
    const price = data.get("price") ? parseFloat(data.get("price") as string) : undefined;
    const duration = data.get("duration") ? parseInt(data.get("duration") as string) : undefined;
    const description = data.get("description") as string;

    if (!id) return fail(400, { missing: true });

    const payload: any = {};
    if (name) payload.name = name;
    if (categoryId) payload.categoryId = categoryId;
    if (price !== undefined) payload.price = price;
    if (duration !== undefined) payload.duration = duration;
    if (description !== undefined) payload.description = description;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể cập nhật dịch vụ" });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },

  deleteService: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(400, { message: "Chưa chọn tổ chức" });

    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { missing: true });

    try {
      const response = await fetch(`${PUBLIC_API_URL}/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const res = await response.json();
        return fail(response.status, { message: res.error || "Không thể xóa dịch vụ" });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },
};
