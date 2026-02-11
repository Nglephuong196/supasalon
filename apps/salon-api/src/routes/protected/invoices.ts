import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewInvoice } from "../../db";
import { getQuery } from "../../lib/query";
import {
  ActivityLogsService,
  ApprovalsService,
  InvoicesService,
  type CreateInvoiceRequest,
  type InvoicePaymentInput,
} from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

export const invoicesProtectedRoutes = new Elysia({ name: "protected-invoices-routes" })
  .use(protectedPlugin)
  .group("/invoices", (app) =>
    app
    .get("/", async ({ request }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const query = getQuery(request);
      const filters: any = {};
      const branchIdParam = query.get("branchId");
      if (branchIdParam) {
        const branchId = Number.parseInt(branchIdParam, 10);
        if (Number.isInteger(branchId) && branchId > 0) {
          filters.branchId = branchId;
        }
      }
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
    .get("/:id/payments", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const invoiceId = Number.parseInt(params.id, 10);
      if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        set.status = 400;
        return { error: "Invoice ID không hợp lệ" };
      }
      return new InvoicesService(db).listPayments(invoiceId, organization.id);
    })
    .post("/", async ({ request, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.CREATE);
      try {
        const invoice = await new InvoicesService(db).create((await request.json()) as CreateInvoiceRequest, organization.id);
        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "invoice",
          entityId: invoice.id,
          action: "create",
        });
        set.status = 201;
        return invoice;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    })
    .post("/:id/settle", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      const invoiceId = Number.parseInt(params.id, 10);
      if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        set.status = 400;
        return { error: "Invoice ID không hợp lệ" };
      }

      try {
        const body = (await request.json()) as {
          payments: InvoicePaymentInput[];
          notes?: string;
        };
        const invoice = await new InvoicesService(db).settle(invoiceId, organization.id, user.id, {
          payments: body.payments ?? [],
          notes: body.notes,
        });

        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "invoice",
          entityId: invoice.id,
          action: "settle_payment",
          metadata: {
            amountPaid: invoice.amountPaid,
            status: invoice.status,
          },
        });

        return invoice;
      } catch (error: any) {
        set.status = 400;
        return { error: error?.message ?? "Không thể thanh toán hóa đơn" };
      }
    })
    .post("/:id/close", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      const invoice = await new InvoicesService(db).update(Number.parseInt(params.id, 10), organization.id, {
        isOpenInTab: false,
      });
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      await new ActivityLogsService(db).log({
        organizationId: organization.id,
        actorUserId: user.id,
        entityType: "invoice",
        entityId: invoice.id,
        action: "close_tab",
      });
      return invoice;
    })
    .post("/:id/cancel", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      const body = (await request.json().catch(() => ({}))) as { reason?: string };
      const invoiceId = Number.parseInt(params.id, 10);
      const approvals = new ApprovalsService(db);
      const approvalPolicy = await approvals.getPolicy(organization.id);

      if (approvalPolicy.requireInvoiceCancelApproval) {
        const approvalRequest = await approvals.createRequest(organization.id, {
          entityType: "invoice",
          entityId: invoiceId,
          action: "invoice_cancel",
          payload: {
            invoiceId,
            reason: body.reason ?? null,
          },
          requestReason: body.reason ?? null,
          requestedByUserId: user.id,
        });

        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "approval_request",
          entityId: approvalRequest.id,
          action: "create",
          reason: body.reason ?? null,
          metadata: {
            target: "invoice_cancel",
            invoiceId,
          },
        });

        set.status = 202;
        return {
          requiresApproval: true,
          approvalRequest,
        };
      }

      const invoice = await new InvoicesService(db).cancel(invoiceId, organization.id, body.reason);
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      await new ActivityLogsService(db).log({
        organizationId: organization.id,
        actorUserId: user.id,
        entityType: "invoice",
        entityId: invoice.id,
        action: "cancel",
        reason: body.reason ?? null,
      });
      return invoice;
    })
    .post("/:id/refund", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      try {
        const body = (await request.json().catch(() => ({}))) as {
          reason?: string;
          amount?: number;
          allocations?: InvoicePaymentInput[];
        };
        const invoiceId = Number.parseInt(params.id, 10);
        const invoiceService = new InvoicesService(db);
        const approvals = new ApprovalsService(db);
        const approvalPolicy = await approvals.getPolicy(organization.id);
        const invoiceDetail = await invoiceService.findById(invoiceId, organization.id);
        if (!invoiceDetail) {
          set.status = 404;
          return { error: "Invoice not found" };
        }

        const requestedAmount = Number(
          body.amount ?? Number(invoiceDetail.amountPaid ?? invoiceDetail.total ?? 0),
        );

        if (
          approvalPolicy.requireInvoiceRefundApproval &&
          requestedAmount >= Number(approvalPolicy.invoiceRefundThreshold ?? 0)
        ) {
          const approvalRequest = await approvals.createRequest(organization.id, {
            entityType: "invoice",
            entityId: invoiceId,
            action: "invoice_refund",
            payload: {
              invoiceId,
              reason: body.reason ?? null,
              amount: body.amount ?? null,
              allocations: body.allocations ?? null,
            },
            requestReason: body.reason ?? null,
            requestedByUserId: user.id,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "approval_request",
            entityId: approvalRequest.id,
            action: "create",
            reason: body.reason ?? null,
            metadata: {
              target: "invoice_refund",
              invoiceId,
              amount: requestedAmount,
            },
          });

          set.status = 202;
          return {
            requiresApproval: true,
            approvalRequest,
          };
        }

        const invoice = await new InvoicesService(db).refund(
          invoiceId,
          organization.id,
          body.reason,
          {
            amount: body.amount,
            allocations: body.allocations,
          },
        );
        if (!invoice) {
          set.status = 404;
          return { error: "Invoice not found" };
        }
        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "invoice",
          entityId: invoice.id,
          action: "refund",
          reason: body.reason ?? null,
          metadata: {
            amount: body.amount ?? null,
            allocations: body.allocations?.length ?? 0,
            status: invoice.status,
          },
        });
        return invoice;
      } catch (error: any) {
        set.status = 400;
        return { error: error?.message ?? "Không thể hoàn tiền hóa đơn" };
      }
    })
    .get("/:id/audit", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.READ);
      const invoiceId = Number.parseInt(params.id, 10);
      if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        set.status = 400;
        return { error: "Invoice ID không hợp lệ" };
      }
      return new ActivityLogsService(db).listByEntity(organization.id, "invoice", invoiceId);
    })
    .put("/:id", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.UPDATE);
      try {
        const body = (await request.json()) as Partial<NewInvoice>;
        const invoice = await new InvoicesService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          body,
        );
        if (!invoice) {
          set.status = 404;
          return { error: "Invoice not found" };
        }
        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "invoice",
          entityId: invoice.id,
          action: "update",
        });
        return invoice;
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Failed to update invoice" };
      }
    })
    .delete("/:id", async ({ request, params, set }) => {
      const { organization, user } = await requirePermissionFor(request, RESOURCES.INVOICE, ACTIONS.DELETE);
      const body = (await request.json().catch(() => ({}))) as { reason?: string };
      const invoiceId = Number.parseInt(params.id, 10);
      const approvals = new ApprovalsService(db);
      const approvalPolicy = await approvals.getPolicy(organization.id);

      if (approvalPolicy.requireInvoiceCancelApproval) {
        const approvalRequest = await approvals.createRequest(organization.id, {
          entityType: "invoice",
          entityId: invoiceId,
          action: "invoice_cancel",
          payload: {
            invoiceId,
            reason: body.reason ?? null,
          },
          requestReason: body.reason ?? null,
          requestedByUserId: user.id,
        });

        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "approval_request",
          entityId: approvalRequest.id,
          action: "create",
          reason: body.reason ?? null,
          metadata: {
            target: "invoice_cancel",
            invoiceId,
          },
        });

        set.status = 202;
        return {
          requiresApproval: true,
          approvalRequest,
        };
      }

      const invoice = await new InvoicesService(db).cancel(invoiceId, organization.id, body.reason);
      if (!invoice) {
        set.status = 404;
        return { error: "Invoice not found" };
      }
      await new ActivityLogsService(db).log({
        organizationId: organization.id,
        actorUserId: user.id,
        entityType: "invoice",
        entityId: invoice.id,
        action: "cancel",
        reason: body.reason ?? null,
      });
      return { message: "Invoice deleted" };
    }),
  );
