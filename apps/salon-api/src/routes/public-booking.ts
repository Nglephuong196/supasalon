import { and, eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod/v4";

import { db } from "../db";
import { bookings, customers, member, organization, serviceCategories, services, user } from "../db";

const createPublicBookingSchema = z.object({
  customerName: z.string().trim().min(2, "Tên khách hàng phải có ít nhất 2 ký tự"),
  customerPhone: z.string().trim().min(8, "Số điện thoại không hợp lệ"),
  dateTime: z.string().min(1, "Vui lòng chọn ngày giờ"),
  guestCount: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(z.number().int().min(1).max(10))
    .optional(),
  guests: z
    .array(
      z.object({
        services: z
          .array(
            z.object({
              serviceId: z
                .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
                .pipe(z.number().int().positive()),
              memberId: z.string().trim().optional(),
            }),
          )
          .min(1, "Mỗi khách cần chọn ít nhất 1 dịch vụ"),
      }),
    )
    .min(1, "Cần có ít nhất 1 khách"),
  notes: z.string().max(500).optional(),
});

export const publicBookingRoutes = new Elysia({ name: "public-booking-routes" })
  .post("/public/organization/check-slug", async ({ request, set }) => {
    const body = await request.json().catch(() => null);
    const parsed = z
      .object({
        slug: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug không hợp lệ"),
      })
      .safeParse(body);

    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" };
    }

    const existed = (
      await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.slug, parsed.data.slug))
        .limit(1)
    )[0];

    return { available: !existed };
  })
  .get("/public/booking/:slug/options", async ({ params, set }) => {
    const org = (
      await db
        .select({ id: organization.id, name: organization.name, slug: organization.slug, logo: organization.logo })
        .from(organization)
        .where(eq(organization.slug, params.slug))
    )[0];

    if (!org) {
      set.status = 404;
      return { error: "Salon không tồn tại" };
    }

    const [serviceList, staffList] = await Promise.all([
      db
        .select({
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
          categoryId: services.categoryId,
        })
        .from(services)
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(eq(serviceCategories.organizationId, org.id)),
      db
        .select({ id: member.id, role: member.role, name: user.name })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, org.id)),
    ]);

    return { organization: org, services: serviceList, staffs: staffList };
  })
  .post("/public/booking/:slug", async ({ params, request, set }) => {
    const parsed = createPublicBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" };
    }

    const body = parsed.data;
    const org = (
      await db.select({ id: organization.id, name: organization.name }).from(organization).where(eq(organization.slug, params.slug))
    )[0];

    if (!org) {
      set.status = 404;
      return { error: "Salon không tồn tại" };
    }

    const bookingDate = new Date(body.dateTime);
    if (Number.isNaN(bookingDate.getTime())) {
      set.status = 400;
      return { error: "Ngày giờ không hợp lệ" };
    }

    const serviceIds: number[] = Array.from(
      new Set(body.guests.flatMap((guest) => guest.services.map((service) => service.serviceId))),
    );

    if (serviceIds.length === 0) {
      set.status = 400;
      return { error: "Vui lòng chọn ít nhất 1 dịch vụ" };
    }

    const orgServices = await db
      .select({ id: services.id, categoryId: services.categoryId, price: services.price })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(serviceCategories.organizationId, org.id), inArray(services.id, serviceIds)));

    if (orgServices.length !== serviceIds.length) {
      set.status = 400;
      return { error: "Có dịch vụ không tồn tại hoặc không thuộc salon" };
    }

    const serviceMap = new Map(orgServices.map((service) => [service.id, service]));

    const memberIds: string[] = Array.from(
      new Set(
        body.guests.flatMap((guest) =>
          guest.services.map((service) => service.memberId).filter((memberId): memberId is string => !!memberId),
        ),
      ),
    );

    if (memberIds.length > 0) {
      const staffs = await db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.organizationId, org.id), inArray(member.id, memberIds)));

      if (staffs.length !== memberIds.length) {
        set.status = 400;
        return { error: "Có nhân viên không tồn tại hoặc không thuộc salon" };
      }
    }

    const normalizedGuests = body.guests.map((guest) => ({
      services: guest.services.map((service) => {
        const svc = serviceMap.get(service.serviceId);
        if (!svc) throw new Error("Service not found in map");
        return {
          categoryId: svc.categoryId,
          serviceId: svc.id,
          memberId: service.memberId || undefined,
          price: svc.price,
        };
      }),
    }));

    let customer = (
      await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.organizationId, org.id), eq(customers.phone, body.customerPhone.trim())))
    )[0];

    if (!customer) {
      const [createdCustomer] = await db
        .insert(customers)
        .values({ organizationId: org.id, name: body.customerName.trim(), phone: body.customerPhone.trim() })
        .returning({ id: customers.id });
      customer = createdCustomer;
    }

    const [createdBooking] = await db
      .insert(bookings)
      .values({
        organizationId: org.id,
        customerId: customer.id,
        date: bookingDate,
        status: "pending",
        guestCount: normalizedGuests.length,
        notes: body.notes?.trim() || "",
        guests: normalizedGuests,
      })
      .returning({ id: bookings.id });

    set.status = 201;
    return {
      success: true,
      message: "Đặt lịch thành công. Salon sẽ liên hệ xác nhận sớm.",
      bookingId: createdBooking.id,
    };
  });
