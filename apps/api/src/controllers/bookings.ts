import { Hono } from "hono";
import { createDb } from "../db";
import { BookingsService } from "../services";
import type { NewBooking } from "../db/schema";

type Bindings = { DB: D1Database };

export const bookingsController = new Hono<{ Bindings: Bindings }>();

bookingsController.get("/", async (c) => {
  const service = new BookingsService(createDb(c.env.DB));
  const salonId = c.req.query("salonId");
  const customerId = c.req.query("customerId");
  if (salonId) {
    const bookings = await service.findBySalonId(parseInt(salonId));
    return c.json(bookings);
  }
  if (customerId) {
    const bookings = await service.findByCustomerId(parseInt(customerId));
    return c.json(bookings);
  }
  const bookings = await service.findAll();
  return c.json(bookings);
});

bookingsController.get("/:id", async (c) => {
  const service = new BookingsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const booking = await service.findById(id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json(booking);
});

bookingsController.post("/", async (c) => {
  const service = new BookingsService(createDb(c.env.DB));
  const body = await c.req.json<NewBooking>();
  const booking = await service.create(body);
  return c.json(booking, 201);
});

bookingsController.put("/:id", async (c) => {
  const service = new BookingsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewBooking>>();
  const booking = await service.update(id, body);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json(booking);
});

bookingsController.delete("/:id", async (c) => {
  const service = new BookingsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const booking = await service.delete(id);
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  return c.json({ message: "Booking deleted" });
});
