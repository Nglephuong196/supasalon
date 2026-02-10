import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Database } from "../db";
import {
  bookings,
  customers,
  member,
  organization,
  serviceCategories,
  services,
  user,
} from "../db/schema";

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

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
};

export const publicBookingController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

publicBookingController.get("/:slug/options", async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");

  const org = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    })
    .from(organization)
    .where(eq(organization.slug, slug))
    .get();

  if (!org) {
    return c.json({ error: "Salon không tồn tại" }, 404);
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
      .select({
        id: member.id,
        role: member.role,
        name: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, org.id)),
  ]);

  return c.json({
    organization: org,
    services: serviceList,
    staffs: staffList,
  });
});

publicBookingController.post("/:slug", zValidator("json", createPublicBookingSchema), async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");
  const body = c.req.valid("json");

  const org = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.slug, slug))
    .get();

  if (!org) {
    return c.json({ error: "Salon không tồn tại" }, 404);
  }

  const bookingDate = new Date(body.dateTime);
  if (Number.isNaN(bookingDate.getTime())) {
    return c.json({ error: "Ngày giờ không hợp lệ" }, 400);
  }

  const serviceIds = Array.from(
    new Set(body.guests.flatMap((guest) => guest.services.map((service) => service.serviceId))),
  );

  if (serviceIds.length === 0) {
    return c.json({ error: "Vui lòng chọn ít nhất 1 dịch vụ" }, 400);
  }

  const orgServices = await db
    .select({
      id: services.id,
      categoryId: services.categoryId,
      price: services.price,
    })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(serviceCategories.organizationId, org.id), inArray(services.id, serviceIds)));

  if (orgServices.length !== serviceIds.length) {
    return c.json({ error: "Có dịch vụ không tồn tại hoặc không thuộc salon" }, 400);
  }

  const serviceMap = new Map(orgServices.map((service) => [service.id, service]));

  const memberIds = Array.from(
    new Set(
      body.guests.flatMap((guest) =>
        guest.services
          .map((service) => service.memberId)
          .filter((memberId): memberId is string => !!memberId),
      ),
    ),
  );

  if (memberIds.length > 0) {
    const staffs = await db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.organizationId, org.id), inArray(member.id, memberIds)));

    if (staffs.length !== memberIds.length) {
      return c.json({ error: "Có nhân viên không tồn tại hoặc không thuộc salon" }, 400);
    }
  }

  const normalizedGuests = body.guests.map((guest) => ({
    services: guest.services.map((service) => {
      const svc = serviceMap.get(service.serviceId);
      if (!svc) {
        throw new Error("Service not found in map");
      }
      return {
        categoryId: svc.categoryId,
        serviceId: svc.id,
        memberId: service.memberId || undefined,
        price: svc.price,
      };
    }),
  }));

  let customer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(eq(customers.organizationId, org.id), eq(customers.phone, body.customerPhone.trim())),
    )
    .get();

  if (!customer) {
    const [createdCustomer] = await db
      .insert(customers)
      .values({
        organizationId: org.id,
        name: body.customerName.trim(),
        phone: body.customerPhone.trim(),
      })
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

  return c.json(
    {
      success: true,
      message: "Đặt lịch thành công. Salon sẽ liên hệ xác nhận sớm.",
      bookingId: createdBooking.id,
    },
    201,
  );
});
