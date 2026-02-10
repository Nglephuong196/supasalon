import { ACTIONS, RESOURCES } from "@repo/constants";
import { Hono } from "hono";
import type { Database } from "../db";
import type { NewInvoice } from "../db/schema";
import { requirePermission } from "../middleware/permission";
import { type CreateInvoiceRequest, InvoicesService } from "../services";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const invoicesController = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// Read operations
invoicesController.get("/", requirePermission(RESOURCES.INVOICE, ACTIONS.READ), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");

  const query = c.req.query();
  const filters: any = {};

  if (query.isOpenInTab) {
    filters.isOpenInTab = query.isOpenInTab === "true";
  }

  if (query.date === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    filters.from = today;
    filters.to = tomorrow;
  } else {
    if (query.from) {
      filters.from = new Date(query.from);
    }
    if (query.to) {
      filters.to = new Date(query.to);
    }
  }

  const invoices = await service.findAll(organization.id, filters);
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

invoicesController.get(
  "/booking/:bookingId",
  requirePermission(RESOURCES.INVOICE, ACTIONS.READ),
  async (c) => {
    const service = new InvoicesService(c.get("db"));
    const organization = c.get("organization");
    const bookingId = parseInt(c.req.param("bookingId"));
    const invoice = await service.findByBookingId(bookingId, organization.id);
    if (!invoice) return c.json({ error: "Invoice not found" }, 404);
    return c.json(invoice);
  },
);

// Create operation
invoicesController.post("/", requirePermission(RESOURCES.INVOICE, ACTIONS.CREATE), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<CreateInvoiceRequest>();

  try {
    console.log("Controller: Creating invoice with body:", JSON.stringify(body));
    const invoice = await service.create(body, organization.id);
    return c.json(invoice, 201);
  } catch (error: any) {
    console.error("Controller Error:", error);
    return c.json({ error: error.message }, 400);
  }
});

// Update operation
invoicesController.post(
  "/:id/close",
  requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE),
  async (c) => {
    const service = new InvoicesService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));

    const invoice = await service.update(id, organization.id, {
      isOpenInTab: false,
    });
    if (!invoice) return c.json({ error: "Invoice not found" }, 404);
    return c.json(invoice);
  },
);

invoicesController.put("/:id", requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE), async (c) => {
  const service = new InvoicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewInvoice>>();

  try {
    console.log("Controller: Updating invoice", id, "with body:", JSON.stringify(body, null, 2));
    const invoice = await service.update(id, organization.id, body);
    if (!invoice) return c.json({ error: "Invoice not found" }, 404);
    return c.json(invoice);
  } catch (error: any) {
    console.error("Controller Update Error:", error);
    return c.json({ error: error.message || "Failed to update invoice" }, 500);
  }
});

// Delete operation
invoicesController.delete(
  "/:id",
  requirePermission(RESOURCES.INVOICE, ACTIONS.DELETE),
  async (c) => {
    const service = new InvoicesService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const invoice = await service.delete(id, organization.id);
    if (!invoice) return c.json({ error: "Invoice not found" }, 404);
    return c.json({ message: "Invoice deleted" });
  },
);
