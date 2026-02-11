import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewInvoice } from "../../db";
import { getQuery } from "../../lib/query";
import { InvoicesService, type CreateInvoiceRequest } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const invoicesProtectedRoutes = new Elysia({ name: "protected-invoices-routes" })
  .use(protectedPlugin)
  .group("/invoices", (app) =>
    app
    .get("/", async ({ request }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const query = getQuery(request);
      const filters: any = {};
      if (query.get("isOpenInTab")) filters.isOpenInTab = query.get("isOpenInTab") === "true";
      if (query.get("date") === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filters.from = today;
        filters.to = tomorrow;
      } else {
        if (query.get("from")) filters.from = new Date(query.get("from") as string);
        if (query.get("to")) filters.to = new Date(query.get("to") as string);
      }
      return new InvoicesService(db).findAll(organization.id, filters);
    })
    .get("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const invoice = await new InvoicesService(db).findById(Number.parseInt(params.id, 10), organization.id);
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      return invoice;
    })
    .get("/booking/:bookingId", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const invoice = await new InvoicesService(db).findByBookingId(Number.parseInt(params.bookingId, 10), organization.id);
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      return invoice;
    })
    .post("/", async ({ request, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.CREATE);
      try {
        const invoice = await new InvoicesService(db).create((await request.json()) as CreateInvoiceRequest, organization.id);
        set.status = 201;
        return invoice;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    })
    .post("/:id/close", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      const invoice = await new InvoicesService(db).update(Number.parseInt(params.id, 10), organization.id, {
        isOpenInTab: false,
      });
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      return invoice;
    })
    .put("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      try {
        const invoice = await new InvoicesService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          (await request.json()) as Partial<NewInvoice>,
        );
        if (!invoice) {
          set.status = 404;
          return { error: "Invoice not found" };
        }
        return invoice;
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Failed to update invoice" };
      }
    })
    .delete("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.DELETE);
      const invoice = await new InvoicesService(db).delete(Number.parseInt(params.id, 10), organization.id);
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      return { message: "Invoice deleted" };
    }),
  );
