import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { BookingsService } from "../services";
import type { NewBooking } from "../db/schema";
import type { Database } from "../db";
import { requirePermission } from "../middleware/permission";
import { RESOURCES, ACTIONS } from "@repo/constants";
import {
  createBookingSchema,
  updateBookingSchema,
  updateStatusSchema,
  bookingQuerySchema,
} from "../schemas";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const bookingsController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Read operations with filtering and pagination
bookingsController.get("/", requirePermission(RESOURCES.BOOKING, ACTIONS.READ), async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");

  // Get query parameters
  const customerId = c.req.query("customerId");
  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");
  const status = c.req.query("status");
  const search = c.req.query("search");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const simple = c.req.query("simple"); // If simple=true, return without pagination

  // If customerId is specified, return simple list
  if (customerId) {
    const bookings = await service.findByCustomerId(parseInt(customerId), organization.id);
    return c.json(bookings);
  }

  // If simple mode (for backwards compatibility)
  if (simple === "true") {
    const bookings = await service.findAllSimple(organization.id);
    return c.json(bookings);
  }

  // Parse dates
  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  // Get paginated and filtered results
  const result = await service.findAll(organization.id, {
    from,
    to,
    status,
    search,
    page,
    limit,
  });

  return c.json(result);
});

// Get booking statistics
bookingsController.get("/stats", requirePermission(RESOURCES.BOOKING, ACTIONS.READ), async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");

  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  const stats = await service.getStats(organization.id, from, to);
  return c.json(stats);
});

bookingsController.get("/:id", requirePermission(RESOURCES.BOOKING, ACTIONS.READ), async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const booking = await service.findById(id, organization.id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json(booking);
});

// Create operation with Zod validation
bookingsController.post(
  "/",
  requirePermission(RESOURCES.BOOKING, ACTIONS.CREATE),
  zValidator("json", createBookingSchema),
  async (c) => {
    const service = new BookingsService(c.get("db"));
    const organization = c.get("organization");
    const body = c.req.valid("json");

    const bookingData = { ...body, organizationId: organization.id };

    const booking = await service.create(bookingData as NewBooking);
    return c.json(booking, 201);
  }
);

// Update operation with Zod validation
bookingsController.put(
  "/:id",
  requirePermission(RESOURCES.BOOKING, ACTIONS.UPDATE),
  zValidator("json", updateBookingSchema),
  async (c) => {
    const service = new BookingsService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const body = c.req.valid("json");

    const booking = await service.update(id, organization.id, body);
    if (!booking) return c.json({ error: "Booking not found" }, 404);
    return c.json(booking);
  }
);

// Quick status update with Zod validation
bookingsController.patch(
  "/:id/status",
  requirePermission(RESOURCES.BOOKING, ACTIONS.UPDATE),
  zValidator("json", updateStatusSchema),
  async (c) => {
    const service = new BookingsService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const { status } = c.req.valid("json");

    const booking = await service.update(id, organization.id, { status });
    if (!booking) return c.json({ error: "Booking not found" }, 404);
    return c.json(booking);
  }
);

// Delete operation
bookingsController.delete("/:id", requirePermission(RESOURCES.BOOKING, ACTIONS.DELETE), async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const booking = await service.delete(id, organization.id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json({ message: "Booking deleted" });
});
