import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermission } from "$lib/permissions";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const load: PageServerLoad = async ({ parent }) => {
  const { memberRole, memberPermissions } = await parent();

  if (!checkPermission(memberRole, memberPermissions, RESOURCES.BOOKING, ACTIONS.READ)) {
    throw redirect(302, "/unauthorized");
  }

  return {};
};

export const actions: Actions = {
  updateProfile: async ({ request, fetch, cookies }) => {
    const organizationId = cookies.get("organizationId");
    if (!organizationId) return fail(401, { message: "Unauthorized" });

    const data = await request.formData();
    const name = data.get("name")?.toString().trim() || "";
    const image = data.get("image")?.toString().trim() || "";
    const organizationName = data.get("organizationName")?.toString().trim() || "";
    const rawOrganizationSlug = data.get("organizationSlug")?.toString().trim() || "";
    const organizationSlug = normalizeSlug(rawOrganizationSlug);

    if (rawOrganizationSlug && !organizationSlug) {
      return fail(400, { message: "Slug salon không hợp lệ" });
    }

    if (organizationSlug && !SLUG_REGEX.test(organizationSlug)) {
      return fail(400, {
        message: "Slug chỉ gồm chữ thường, số và dấu gạch ngang (không ở đầu/cuối)",
      });
    }

    try {
      const userRes = await fetch(`${PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      if (!userRes.ok) {
        const err = await userRes.json().catch(() => ({}));
        return fail(userRes.status, { message: err.error || "Không thể cập nhật hồ sơ" });
      }

      const organizationUpdatePayload: Record<string, string> = {};
      if (organizationName) {
        organizationUpdatePayload.name = organizationName;
      }
      if (organizationSlug) {
        organizationUpdatePayload.slug = organizationSlug;
      }

      if (Object.keys(organizationUpdatePayload).length > 0) {
        const orgRes = await fetch(`${PUBLIC_API_URL}/api/auth/organization/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            data: organizationUpdatePayload,
          }),
        });

        if (!orgRes.ok) {
          const err = await orgRes.json().catch(() => ({}));
          const message =
            err?.message || err?.error || "Không thể cập nhật thông tin salon. Vui lòng thử lại.";
          return fail(orgRes.status, { message });
        }
      }

      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },
};
