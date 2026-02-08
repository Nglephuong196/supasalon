import type { Actions, PageServerLoad } from "./$types";
import { PUBLIC_API_URL } from "$env/static/public";
import { error, fail } from "@sveltejs/kit";

interface PublicBookingOptionsResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  services: Array<{
    id: number;
    name: string;
    price: number;
    duration: number;
    categoryId: number;
  }>;
  staffs: Array<{
    id: string;
    role: string;
    name: string;
  }>;
}

export const load: PageServerLoad = async ({ params, fetch }) => {
  const slug = params.slug;

  const res = await fetch(`${PUBLIC_API_URL}/public/booking/${slug}/options`);

  if (res.status === 404) {
    throw error(404, "Salon không tồn tại hoặc đã ngừng nhận đặt lịch");
  }

  if (!res.ok) {
    throw error(500, "Không thể tải dữ liệu đặt lịch");
  }

  const options = (await res.json()) as PublicBookingOptionsResponse;

  return {
    slug,
    organization: options.organization,
    services: options.services,
    staffs: options.staffs,
  };
};

export const actions: Actions = {
  create: async ({ request, fetch, params }) => {
    const slug = params.slug;
    const data = await request.formData();

    const customerName = data.get("customerName")?.toString().trim() || "";
    const customerPhone = data.get("customerPhone")?.toString().trim() || "";
    const dateTime = data.get("dateTime")?.toString().trim() || "";
    const notes = data.get("notes")?.toString().trim() || "";
    const guestCount = data.get("guestCount")?.toString().trim() || "1";
    const guestsRaw = data.get("guests")?.toString().trim() || "";

    const values = { customerName, customerPhone, dateTime, notes, guestCount, guests: guestsRaw };

    if (!customerName || !customerPhone || !dateTime || !guestsRaw) {
      return fail(400, {
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
        values,
      });
    }

    let guests: Array<{ services: Array<{ serviceId: number; memberId?: string }> }> = [];

    try {
      guests = JSON.parse(guestsRaw);
    } catch (_e) {
      return fail(400, {
        message: "Dữ liệu dịch vụ không hợp lệ",
        values,
      });
    }

    const payload = {
      customerName,
      customerPhone,
      dateTime,
      guestCount: Number(guestCount),
      guests,
      notes,
    };

    try {
      const res = await fetch(`${PUBLIC_API_URL}/public/booking/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return fail(res.status, {
          message: err.error || err.message || "Không thể tạo lịch hẹn",
          values,
        });
      }

      return {
        success: true,
        message: "Đặt lịch thành công. Salon sẽ liên hệ xác nhận sớm.",
      };
    } catch (_e) {
      return fail(500, {
        message: "Lỗi máy chủ, vui lòng thử lại sau",
        values,
      });
    }
  },
};
