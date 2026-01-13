import { Hono } from "hono";
import { BookingsService } from "../services";
import type { NewBooking } from "../db/schema";
import type { Database } from "../db";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const bookingsController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

bookingsController.get("/", async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const customerId = c.req.query("customerId");

  if (customerId) {
    const bookings = await service.findByCustomerId(parseInt(customerId), organization.id);
    return c.json(bookings);
  }

  const bookings = await service.findAll(organization.id);
  return c.json(bookings);
});

bookingsController.get("/:id", async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const booking = await service.findById(id, organization.id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json(booking);
});

bookingsController.post("/", async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewBooking>();

  const bookingData = { ...body, organizationId: organization.id };

  const booking = await service.create(bookingData);
  return c.json(booking, 201);
});

bookingsController.put("/:id", async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewBooking>>();

  // Prevent moving booking to another organization if implemented at API level, though organizationId is usually set by system or verified.
  if (body.organizationId && body.organizationId !== organization.id) {
    return c.json({ error: "Cannot move booking to another organization" }, 403);
  }

  const booking = await service.update(id, organization.id, body);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json(booking);
});

bookingsController.delete("/:id", async (c) => {
  const service = new BookingsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const booking = await service.delete(id, organization.id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json({ message: "Booking deleted" });
});
