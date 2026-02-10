import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermission } from "$lib/permissions";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

type RangeKey = "today" | "week" | "month" | "year";

function clampRange(range?: string | null): RangeKey {
  if (range === "today" || range === "week" || range === "month" || range === "year") {
    return range;
  }
  return "week";
}

export const load: PageServerLoad = async ({ fetch, parent, url, cookies }) => {
  const organizationId = cookies.get("organizationId");
  const { memberRole, memberPermissions } = await parent();

  if (!checkPermission(memberRole, memberPermissions, RESOURCES.BOOKING, ACTIONS.READ)) {
    throw redirect(302, "/unauthorized");
  }

  if (!organizationId) {
    return {
      range: "week",
      chart: {
        labels: [],
        data: [],
        unit: "₫",
        title: "Doanh thu",
        context: "",
        compare: "",
      },
      stats: {
        revenue: 0,
        appointments: 0,
        newCustomers: 0,
        avgInvoice: 0,
        trend: { revenue: 0, appointments: 0, newCustomers: 0, avgInvoice: 0 },
      },
      schedule: [],
      topStylists: [],
      lowStock: [],
    };
  }

  const range = clampRange(url.searchParams.get("range"));
  try {
    const res = await fetch(`${PUBLIC_API_URL}/dashboard?range=${range}`);
    if (!res.ok) {
      throw new Error(`Dashboard fetch failed: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error("Error fetching dashboard data", e);
    return {
      range,
      chart: {
        labels: [],
        data: [],
        unit: "₫",
        title: "Doanh thu",
        context: "",
        compare: "",
      },
      stats: {
        revenue: 0,
        appointments: 0,
        newCustomers: 0,
        avgInvoice: 0,
        trend: { revenue: 0, appointments: 0, newCustomers: 0, avgInvoice: 0 },
      },
      schedule: [],
      topStylists: [],
      lowStock: [],
    };
  }
};
