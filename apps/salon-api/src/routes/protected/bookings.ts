import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewBooking } from "../../db";
import { getQuery, toPositiveInt } from "../../lib/query";
import { bookingQuerySchema, createBookingSchema, updateBookingSchema, updateStatusSchema } from "../../schemas";
import { BookingsService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const bookingsProtectedRoutes = new Elysia({ name: "protected-bookings-routes" })
  .use(protectedPlugin)
  .group("/bookings", (app) =>
    app
    .get("/", async ({ request }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
      const query = getQuery(request);
      const customerId = query.get("customerId");
      const branchIdParam = query.get("branchId");
      const fromStr = query.get("from");
      const toStr = query.get("to");
      const status = query.get("status") || undefined;
      const search = query.get("search") || undefined;
      const page = toPositiveInt(query.get("page"), 1);
      const limit = toPositiveInt(query.get("limit"), 20);
      const simple = query.get("simple");
      const branchId =
        branchIdParam && Number.isInteger(Number.parseInt(branchIdParam, 10))
          ? Number.parseInt(branchIdParam, 10)
          : undefined;

      const service = new BookingsService(db);
      if (customerId) return service.findByCustomerId(Number.parseInt(customerId, 10), organization.id);
      if (simple === "true") return service.findAllSimple(organization.id, branchId);

      const from = fromStr ? new Date(`${fromStr}T00:00:00`) : undefined;
      const to = toStr ? new Date(`${toStr}T23:59:59.999`) : undefined;

      const parsedQuery = bookingQuerySchema.safeParse(Object.fromEntries(query.entries()));
      if (!parsedQuery.success) {
        return service.findAll(organization.id, {
          branchId,
          from,
          to,
          status,
          search,
          page,
          limit,
        });
      }

      return service.findAll(organization.id, {
        branchId,
        from,
        to,
        status,
        search,
        page,
        limit,
      });
    })
    .get("/stats", async ({ request }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
      const query = getQuery(request);
      const from = query.get("from") ? new Date(`${query.get("from")}T00:00:00`) : undefined;
      const to = query.get("to") ? new Date(`${query.get("to")}T23:59:59.999`) : undefined;
      const branchIdParam = query.get("branchId");
      const branchId =
        branchIdParam && Number.isInteger(Number.parseInt(branchIdParam, 10))
          ? Number.parseInt(branchIdParam, 10)
          : undefined;
      return new BookingsService(db).getStats(organization.id, from, to, branchId);
    })
    .get("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
      const booking = await new BookingsService(db).findById(Number.parseInt(params.id, 10), organization.id);
      if (!booking) {
        set.status = 404;
        return { error: "Booking not found" };
      }
      return booking;
    })
    .post("/", async ({ request, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.CREATE);
      const parsed = createBookingSchema.safeParse(await request.json());
      if (!parsed.success) {
        set.status = 400;
        return { error: parsed.error.issues[0]?.message || "Invalid request" };
      }
      const booking = await new BookingsService(db).create({ ...parsed.data, organizationId: organization.id } as NewBooking);
      set.status = 201;
      return booking;
    })
    .put("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.UPDATE);
      const parsed = updateBookingSchema.safeParse(await request.json());
      if (!parsed.success) {
        set.status = 400;
        return { error: parsed.error.issues[0]?.message || "Invalid request" };
      }
      const booking = await new BookingsService(db).update(Number.parseInt(params.id, 10), organization.id, parsed.data);
      if (!booking) {
        set.status = 404;
        return { error: "Booking not found" };
      }
      return booking;
    })
    .patch("/:id/status", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.UPDATE);
      const parsed = updateStatusSchema.safeParse(await request.json());
      if (!parsed.success) {
        set.status = 400;
        return { error: parsed.error.issues[0]?.message || "Invalid request" };
      }
      const booking = await new BookingsService(db).update(Number.parseInt(params.id, 10), organization.id, {
        status: parsed.data.status,
        noShowReason: parsed.data.noShowReason ?? null,
      });
      if (!booking) {
        set.status = 404;
        return { error: "Booking not found" };
      }
      return booking;
    })
    .delete("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.DELETE);
      const booking = await new BookingsService(db).delete(Number.parseInt(params.id, 10), organization.id);
      if (!booking) {
        set.status = 404;
        return { error: "Booking not found" };
      }
      return { message: "Booking deleted" };
    }),
  );
