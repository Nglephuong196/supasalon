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

    void payload.name;
    void payload.image;
    throw new Error("Profile/organization update endpoints are not available in apps/api yet.");
  },
};
