import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import { BookingsService, CustomersService, InvoicesService, MembersService, ProductsService, ServicesService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

function clampRange(range?: string | null): "today" | "week" | "month" | "year" {
  if (range === "today" || range === "week" || range === "month" || range === "year") return range;
  return "week";
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getRange(range: "today" | "week" | "month" | "year") {
  const now = new Date();
  if (range === "today") {
    const from = startOfDay(now);
    const to = endOfDay(now);
    const prevFrom = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const prevTo = endOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    return { from, to, prevFrom, prevTo, label: "Hôm nay", compare: "so với hôm qua" };
  }
  if (range === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevTo = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { from, to, prevFrom, prevTo, label: "Tháng này", compare: "so với tháng trước" };
  }
  if (range === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = endOfDay(new Date(now.getFullYear(), 11, 31));
    const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
    const prevTo = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
    return { from, to, prevFrom, prevTo, label: "Năm nay", compare: "so với năm trước" };
  }

  const from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const to = endOfDay(now);
  const prevFrom = startOfDay(new Date(from.getTime() - 7 * 24 * 60 * 60 * 1000));
  const prevTo = endOfDay(new Date(from.getTime() - 24 * 60 * 60 * 1000));
  return { from, to, prevFrom, prevTo, label: "7 ngày qua", compare: "so với 7 ngày trước" };
}

function percentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function buildChart(range: "today" | "week" | "month" | "year", invoices: any[], from: Date) {
  const unit = "₫";
  if (range === "today") {
    const labels = ["08h", "10h", "12h", "14h", "16h", "18h", "20h"];
    const buckets = [8, 10, 12, 14, 16, 18, 20];
    const data = buckets.map((hour) =>
      invoices
        .filter((i) => {
          const d = new Date(i.createdAt);
          return d.getHours() >= hour && d.getHours() < hour + 2;
        })
        .reduce((sum, i) => sum + (i.total || 0), 0),
    );
    return { labels, data, unit, title: "Doanh thu theo giờ", context: "Hôm nay" };
  }

  if (range === "month") {
    const labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
    const data = [0, 0, 0, 0];
    invoices.forEach((invoice) => {
      const d = new Date(invoice.createdAt);
      const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      data[week] += invoice.total || 0;
    });
    return { labels, data, unit, title: "Doanh thu theo tuần", context: "Tháng này" };
  }

  if (range === "year") {
    const labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const data = new Array(12).fill(0);
    invoices.forEach((invoice) => {
      const d = new Date(invoice.createdAt);
      data[d.getMonth()] += invoice.total || 0;
    });
    return { labels, data, unit, title: "Doanh thu theo tháng", context: "Năm nay" };
  }

  const labels: string[] = [];
  const data: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push(d.toLocaleDateString("vi-VN", { weekday: "short" }));
    const total = invoices
      .filter((invoice) => {
        const created = new Date(invoice.createdAt);
        return created.toDateString() === d.toDateString();
      })
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    data.push(total);
  }
  return { labels, data, unit, title: "Doanh thu theo ngày", context: "7 ngày qua" };
}

export const dashboardProtectedRoutes = new Elysia({ name: "protected-dashboard-routes" })
  .use(protectedPlugin)
  .group("/dashboard", (app) =>
    app.get("/", async ({ request }) => {
    const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);

    const range = clampRange(getQuery(request).get("range"));
    const { from, to, prevFrom, prevTo, label, compare } = getRange(range);

    const bookingsService = new BookingsService(db);
    const invoicesService = new InvoicesService(db);
    const customersService = new CustomersService(db);
    const productsService = new ProductsService(db);
    const membersService = new MembersService(db);
    const servicesService = new ServicesService(db);

    const [bookingsStats, bookingsStatsPrev, bookingsData, invoices, invoicesPrev, customers, products, members, services] =
      await Promise.all([
        bookingsService.getStats(organization.id, from, to),
        bookingsService.getStats(organization.id, prevFrom, prevTo),
        bookingsService.findAll(organization.id, { from, to, limit: 200 }),
        invoicesService.findAll(organization.id, { from, to }),
        invoicesService.findAll(organization.id, { from: prevFrom, to: prevTo }),
        customersService.findAll(organization.id),
        productsService.findAll(organization.id),
        membersService.findAll(organization.id),
        servicesService.findAll(organization.id),
      ]);

    const paidInvoices = invoices.filter((i: any) => i.status === "paid");
    const paidInvoicesPrev = invoicesPrev.filter((i: any) => i.status === "paid");
    const revenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
    const revenuePrev = paidInvoicesPrev.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
    const avgInvoice = paidInvoices.length > 0 ? Math.round(revenue / paidInvoices.length) : 0;
    const avgInvoicePrev = paidInvoicesPrev.length > 0 ? Math.round(revenuePrev / paidInvoicesPrev.length) : 0;

    const newCustomers = customers.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created >= from && created <= to;
    }).length;
    const newCustomersPrev = customers.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created >= prevFrom && created <= prevTo;
    }).length;

    const chart = buildChart(range, paidInvoices, from);

    const servicesById = new Map(services.map((s: any) => [s.id, s.name]));
    const membersById = new Map(members.map((m: any) => [m.id, m.user?.name || "Nhân viên"]));

    const schedule = (bookingsData.data || [])
      .filter((b: any) => {
        const d = new Date(b.date);
        return d >= from && d <= to;
      })
      .slice(0, 8)
      .map((b: any) => {
        const date = new Date(b.date);
        const firstServiceId = b.guests?.[0]?.services?.[0]?.serviceId;
        const firstStaffId = b.guests?.[0]?.services?.[0]?.memberId;
        return {
          id: b.id,
          time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          customer: b.customer?.name || "Khách hàng",
          service: servicesById.get(firstServiceId) || "Dịch vụ",
          staff: membersById.get(firstStaffId) || "Nhân viên",
          status: b.status,
        };
      });

    const staffRevenue = new Map<string, { name: string; revenue: number; count: number }>();
    invoices.forEach((invoice: any) => {
      if (invoice.status !== "paid") return;
      (invoice.items || []).forEach((item: any) => {
        (item.staffCommissions || []).forEach((staffItem: any) => {
          const staffId = staffItem.staffId;
          const name = String(membersById.get(staffId) || "Nhân viên");
          const entry = staffRevenue.get(staffId) || { name, revenue: 0, count: 0 };
          entry.revenue += item.total || 0;
          entry.count += 1;
          staffRevenue.set(staffId, entry);
        });
      });
    });

    const sortedStaff = Array.from(staffRevenue.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topRevenue = sortedStaff[0]?.revenue || 1;
    const topStylists = sortedStaff.map((staff) => ({
      id: staff.id,
      name: staff.name,
      revenue: staff.revenue,
      revenuePercent: Math.round((staff.revenue / topRevenue) * 100),
      appointments: staff.count,
      avatar: staff.name
        .split(" ")
        .slice(-2)
        .map((part: string) => part[0])
        .join("")
        .toUpperCase(),
    }));

    const lowStock = products
      .filter((p: any) => (p.stock ?? 0) <= (p.minStock ?? 10))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 10,
        status: p.stock <= Math.max(1, Math.round((p.minStock ?? 10) * 0.3)) ? "critical" : "warning",
      }))
      .slice(0, 6);

    return {
      range,
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
      chart: { ...chart, compare, context: label },
      stats: {
        revenue,
        appointments: bookingsStats.total || 0,
        newCustomers,
        avgInvoice,
        trend: {
          revenue: percentChange(revenue, revenuePrev),
          appointments: percentChange(bookingsStats.total || 0, bookingsStatsPrev.total || 0),
          newCustomers: percentChange(newCustomers, newCustomersPrev),
          avgInvoice: percentChange(avgInvoice, avgInvoicePrev),
        },
      },
      schedule,
      topStylists,
      lowStock,
    };
    }),
  );
