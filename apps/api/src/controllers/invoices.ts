import { Hono } from "hono";
import { InvoicesService } from "../services";
import type { NewInvoice } from "../db/schema";
import type { Database } from "../db";
import { requirePermission } from "../middleware/permission";
import { RESOURCES, ACTIONS } from "@repo/constants";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const invoicesController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Read operations
invoicesController.get("/", requirePermission(RESOURCES.INVOICE, ACTIONS.READ), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const invoices = await service.findAll(organization.id);
  return c.json(invoices);
});

invoicesController.get("/:id", requirePermission(RESOURCES.INVOICE, ACTIONS.READ), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const invoice = await service.findById(id, organization.id);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

invoicesController.get("/booking/:bookingId", requirePermission(RESOURCES.INVOICE, ACTIONS.READ), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const bookingId = parseInt(c.req.param("bookingId"));
  const invoice = await service.findByBookingId(bookingId, organization.id);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

// Create operation
invoicesController.post("/", requirePermission(RESOURCES.INVOICE, ACTIONS.CREATE), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewInvoice>();

  try {
    const invoice = await service.create(body, organization.id);
    return c.json(invoice, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Update operation
invoicesController.put("/:id", requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewInvoice>>();

  const invoice = await service.update(id, organization.id, body);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json(invoice);
});

// Delete operation
invoicesController.delete("/:id", requirePermission(RESOURCES.INVOICE, ACTIONS.DELETE), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const invoice = await service.delete(id, organization.id);
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  return c.json({ message: "Invoice deleted" });
});
