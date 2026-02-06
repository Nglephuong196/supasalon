import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { checkPermission } from "$lib/permissions";

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

    try {
      const res = await fetch(`${PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      if (!res.ok) {
        const err = await res.json();
        return fail(res.status, { message: err.error || "Không thể cập nhật hồ sơ" });
      }
      return { success: true };
    } catch (e) {
      return fail(500, { message: "Lỗi máy chủ" });
    }
  },
};
