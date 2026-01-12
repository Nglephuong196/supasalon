import { Hono } from "hono";
import { createDb } from "../db";
import { InvoicesService } from "../services";
import type { NewInvoice } from "../db/schema";

type Bindings = { DB: D1Database };

export const invoicesController = new Hono<{ Bindings: Bindings }>();

invoicesController.get("/", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const invoices = await service.findAll();
  return c.json(invoices);
});

invoicesController.get("/:id", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const invoice = await service.findById(id);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

invoicesController.get("/booking/:bookingId", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const bookingId = parseInt(c.req.param("bookingId"));
  const invoice = await service.findByBookingId(bookingId);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

invoicesController.post("/", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const body = await c.req.json<NewInvoice>();
  const invoice = await service.create(body);
  return c.json(invoice, 201);
});

invoicesController.put("/:id", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewInvoice>>();
  const invoice = await service.update(id, body);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

invoicesController.delete("/:id", async (c) => {
  const service = new InvoicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const invoice = await service.delete(id);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json({ message: "Invoice deleted" });
});
