import { apiClient } from "@/lib/api";
import { organization } from "@/lib/auth-client";

export type ProfilePayload = {
  name: string;
  image: string;
  organizationName: string;
  organizationSlug: string;
};

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

export const profileService = {
  async updateProfile(payload: ProfilePayload) {
    const organizationSlug = normalizeSlug(payload.organizationSlug);

    if (payload.organizationSlug && !organizationSlug) {
      throw new Error("Slug salon không hợp lệ");
    }

    if (organizationSlug && !SLUG_REGEX.test(organizationSlug)) {
      throw new Error("Slug chỉ gồm chữ thường, số và dấu gạch ngang (không ở đầu/cuối)");
    }

    await apiClient.patch("/users/me", {
      name: payload.name,
      image: payload.image,
    });

    let organizationId =
      (typeof localStorage !== "undefined" ? localStorage.getItem("organizationId") : null) ?? null;

    if (!organizationId) {
      try {
        const listResult = (await organization.list()) as {
          data?: Array<{ id?: string }> | undefined;
        };
        const firstOrgId = listResult.data?.[0]?.id;
        if (firstOrgId) {
          organizationId = firstOrgId;
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("organizationId", firstOrgId);
          }
        }
      } catch {
        // no-op, org update below will be skipped
      }
    }

    const updateData: Record<string, string> = {};
    if (payload.organizationName.trim()) {
      updateData.name = payload.organizationName.trim();
    }
    if (organizationSlug) {
      updateData.slug = organizationSlug;
    }

    if (organizationId && Object.keys(updateData).length > 0) {
      await apiClient.post("/api/auth/organization/update", {
        organizationId,
        data: updateData,
      });
    }
  },
};
