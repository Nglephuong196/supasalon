import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import { ActivityLogsService, ApprovalsService, CashManagementService, InvoicesService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

function parseOptionalDate(value: string | null, label: string) {
  if (!value) return undefined;
  return parseDateInput(value, label);
}

export const cashManagementProtectedRoutes = new Elysia({
  name: "protected-cash-management-routes",
})
  .use(protectedPlugin)
  .group("/cash-management", (app) =>
    app
      .get("/overview", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const from = parseOptionalDate(query.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(query.get("to"), "Ngày kết thúc");
          return new CashManagementService(db).getOverview(organization.id, from, to);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải dữ liệu quỹ" };
        }
      })
      .get("/session/current", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        const service = new CashManagementService(db);
        const currentSession = await service.getCurrentSession(organization.id);
        const currentSnapshot = await service.getCurrentSessionSnapshot(organization.id);
        return { currentSession, currentSnapshot };
      })
      .post("/session/open", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        try {
          const body = (await request.json()) as { openingBalance: number; notes?: string };
          const opened = await new CashManagementService(db).openSession(organization.id, user.id, {
            openingBalance: Number(body.openingBalance ?? 0),
            notes: body.notes,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "cash_session",
            entityId: opened.id,
            action: "open",
            metadata: {
              openingBalance: opened.openingBalance,
            },
          });

          set.status = 201;
          return opened;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể mở ca quỹ" };
        }
      })
      .post("/session/:id/close", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const sessionId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(sessionId) || sessionId <= 0) {
          set.status = 400;
          return { error: "ID ca quỹ không hợp lệ" };
        }

        try {
          const body = (await request.json()) as { actualClosingBalance: number; notes?: string };
          const closed = await new CashManagementService(db).closeSession(
            organization.id,
            sessionId,
            user.id,
            {
              actualClosingBalance: Number(body.actualClosingBalance ?? 0),
              notes: body.notes,
            },
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "cash_session",
            entityId: closed.session.id,
            action: "close",
            metadata: {
              expectedClosingBalance: closed.snapshot.expectedClosingBalance,
              actualClosingBalance: closed.session.actualClosingBalance,
              discrepancy: closed.discrepancy,
            },
          });

          return closed;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể đóng ca quỹ" };
        }
      })
      .get("/sessions", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const statusParam = query.get("status");
          const status =
            statusParam === "open" || statusParam === "closed"
              ? (statusParam as "open" | "closed")
              : undefined;
          const from = parseOptionalDate(query.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(query.get("to"), "Ngày kết thúc");

          return new CashManagementService(db).listSessions(organization.id, {
            status,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải lịch sử ca quỹ" };
        }
      })
      .get("/transactions", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const from = parseOptionalDate(query.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(query.get("to"), "Ngày kết thúc");
          const cashSessionId = query.get("cashSessionId")
            ? Number.parseInt(query.get("cashSessionId") as string, 10)
            : undefined;

          if (cashSessionId !== undefined && (!Number.isInteger(cashSessionId) || cashSessionId <= 0)) {
            throw new Error("cashSessionId không hợp lệ");
          }

          return new CashManagementService(db).listCashTransactions(organization.id, {
            cashSessionId,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải giao dịch quỹ" };
        }
      })
      .post("/transactions", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        try {
          const body = (await request.json()) as {
            type: "in" | "out";
            amount: number;
            category?: string;
            notes?: string;
            cashSessionId?: number;
          };

          if (body.type !== "in" && body.type !== "out") {
            throw new Error("type phải là in hoặc out");
          }

          if (body.type === "out") {
            const approvals = new ApprovalsService(db);
            const policy = await approvals.getPolicy(organization.id);
            const amount = Number(body.amount ?? 0);

            if (
              policy.requireCashOutApproval &&
              amount >= Number(policy.cashOutThreshold ?? 0)
            ) {
              const approvalRequest = await approvals.createRequest(organization.id, {
                entityType: "cash_transaction",
                entityId: null,
                action: "cash_out",
                payload: {
                  amount,
                  category: body.category ?? null,
                  notes: body.notes ?? null,
                  cashSessionId: body.cashSessionId ?? null,
                },
                requestReason: body.notes ?? null,
                requestedByUserId: user.id,
              });

              await new ActivityLogsService(db).log({
                organizationId: organization.id,
                actorUserId: user.id,
                entityType: "approval_request",
                entityId: approvalRequest.id,
                action: "create",
                reason: body.notes ?? null,
                metadata: {
                  target: "cash_out",
                  amount,
                },
              });

              set.status = 202;
              return {
                requiresApproval: true,
                approvalRequest,
              };
            }
          }

          const transaction = await new CashManagementService(db).createCashTransaction(
            organization.id,
            user.id,
            {
              type: body.type,
              amount: Number(body.amount ?? 0),
              category: body.category,
              notes: body.notes,
              cashSessionId: body.cashSessionId,
            },
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "cash_transaction",
            entityId: transaction.id,
            action: body.type === "in" ? "cash_in" : "cash_out",
            reason: transaction.notes ?? null,
            metadata: {
              amount: transaction.amount,
              category: transaction.category,
              cashSessionId: transaction.cashSessionId,
            },
          });

          set.status = 201;
          return transaction;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo giao dịch quỹ" };
        }
      })
      .get("/report/payment-method", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const from = parseOptionalDate(query.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(query.get("to"), "Ngày kết thúc");
          return new CashManagementService(db).getPaymentMethodReport(organization.id, from, to);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải báo cáo phương thức" };
        }
      })
      .get("/pending-payments", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const from = parseOptionalDate(query.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(query.get("to"), "Ngày kết thúc");
          return new InvoicesService(db).listPendingPayments(organization.id, { from, to });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải giao dịch chờ xác nhận" };
        }
      })
      .patch("/payments/:id/confirm", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const paymentId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(paymentId) || paymentId <= 0) {
          set.status = 400;
          return { error: "ID giao dịch không hợp lệ" };
        }

        try {
          const body = (await request.json().catch(() => ({}))) as { note?: string };
          const updated = await new InvoicesService(db).updatePaymentStatus(
            paymentId,
            organization.id,
            "confirmed",
            body.note,
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "invoice_payment",
            entityId: updated.id,
            action: "confirm",
            reason: body.note ?? null,
            metadata: {
              invoiceId: updated.invoiceId,
              amount: updated.amount,
              method: updated.method,
            },
          });

          return updated;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể xác nhận giao dịch" };
        }
      })
      .patch("/payments/:id/fail", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const paymentId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(paymentId) || paymentId <= 0) {
          set.status = 400;
          return { error: "ID giao dịch không hợp lệ" };
        }

        try {
          const body = (await request.json().catch(() => ({}))) as { note?: string };
          const updated = await new InvoicesService(db).updatePaymentStatus(
            paymentId,
            organization.id,
            "failed",
            body.note,
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "invoice_payment",
            entityId: updated.id,
            action: "fail",
            reason: body.note ?? null,
            metadata: {
              invoiceId: updated.invoiceId,
              amount: updated.amount,
              method: updated.method,
            },
          });

          return updated;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật giao dịch" };
        }
      }),
  );
