import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import {
  ActivityLogsService,
  ApprovalsService,
  CashManagementService,
  InvoicesService,
  type ApprovalEntityType,
} from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

export const approvalRequestsProtectedRoutes = new Elysia({ name: "protected-approval-requests-routes" })
  .use(protectedPlugin)
  .group("/approval-requests", (app) =>
    app
      .get("/policy", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        return new ApprovalsService(db).getPolicy(organization.id);
      })
      .put("/policy", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        try {
          const body = (await request.json()) as {
            requireInvoiceCancelApproval?: boolean;
            requireInvoiceRefundApproval?: boolean;
            invoiceRefundThreshold?: number;
            requireCashOutApproval?: boolean;
            cashOutThreshold?: number;
          };
          return new ApprovalsService(db).upsertPolicy(organization.id, body);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật chính sách duyệt" };
        }
      })
      .get("/", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const status = query.get("status");
          const entityType = query.get("entityType");
          const from = query.get("from") ? parseDateInput(query.get("from"), "Ngày bắt đầu") : undefined;
          const to = query.get("to") ? parseDateInput(query.get("to"), "Ngày kết thúc") : undefined;

          return new ApprovalsService(db).listRequests(organization.id, {
            status:
              status === "pending" ||
              status === "approved" ||
              status === "rejected" ||
              status === "cancelled"
                ? status
                : undefined,
            entityType:
              entityType === "invoice" ||
              entityType === "cash_transaction" ||
              entityType === "booking" ||
              entityType === "commission_payout" ||
              entityType === "prepaid_card"
                ? (entityType as ApprovalEntityType)
                : undefined,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải danh sách yêu cầu duyệt" };
        }
      })
      .patch("/:id/approve", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const approvalId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(approvalId) || approvalId <= 0) {
          set.status = 400;
          return { error: "ID yêu cầu duyệt không hợp lệ" };
        }

        try {
          const body = (await request.json().catch(() => ({}))) as { reviewReason?: string };
          const approvals = new ApprovalsService(db);
          const requestItem = await approvals.findRequestById(approvalId, organization.id);
          if (!requestItem) {
            set.status = 404;
            return { error: "Không tìm thấy yêu cầu duyệt" };
          }
          if (requestItem.status !== "pending") {
            set.status = 400;
            return { error: "Yêu cầu này đã được xử lý" };
          }

          let executionResult: Record<string, unknown> | null = null;

          if (requestItem.action === "invoice_cancel") {
            const payload = (requestItem.payload ?? {}) as {
              invoiceId?: number;
              reason?: string;
            };
            const invoiceId = Number(payload.invoiceId);
            if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
              throw new Error("Dữ liệu approval không hợp lệ: invoiceId");
            }
            const cancelled = await new InvoicesService(db).cancel(invoiceId, organization.id, payload.reason);
            if (!cancelled) {
              throw new Error("Không tìm thấy hóa đơn");
            }
            executionResult = {
              invoiceId: cancelled.id,
              status: cancelled.status,
            };
          } else if (requestItem.action === "invoice_refund") {
            const payload = (requestItem.payload ?? {}) as {
              invoiceId?: number;
              reason?: string;
              amount?: number;
              allocations?: Array<{
                method: "cash" | "card" | "transfer";
                amount: number;
                status?: "pending" | "confirmed" | "failed" | "cancelled";
                referenceCode?: string;
                notes?: string;
              }>;
            };
            const invoiceId = Number(payload.invoiceId);
            if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
              throw new Error("Dữ liệu approval không hợp lệ: invoiceId");
            }
            const refunded = await new InvoicesService(db).refund(
              invoiceId,
              organization.id,
              payload.reason,
              {
                amount: payload.amount,
                allocations: payload.allocations,
              },
            );
            if (!refunded) {
              throw new Error("Không tìm thấy hóa đơn");
            }
            executionResult = {
              invoiceId: refunded.id,
              status: refunded.status,
            };
          } else if (requestItem.action === "cash_out") {
            const payload = (requestItem.payload ?? {}) as {
              amount?: number;
              category?: string;
              notes?: string;
              cashSessionId?: number;
            };

            const created = await new CashManagementService(db).createCashTransaction(
              organization.id,
              user.id,
              {
                type: "out",
                amount: Number(payload.amount ?? 0),
                category: payload.category,
                notes: payload.notes,
                cashSessionId: payload.cashSessionId,
              },
            );

            executionResult = {
              cashTransactionId: created.id,
              amount: created.amount,
            };
          } else {
            throw new Error("Loại hành động chưa được hỗ trợ thực thi");
          }

          const approved = await approvals.approveRequest(
            approvalId,
            organization.id,
            user.id,
            body.reviewReason,
          );

          if (!approved) {
            throw new Error("Không thể cập nhật trạng thái duyệt");
          }

          await approvals.markExecuted(approvalId, organization.id, executionResult);

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "approval_request",
            entityId: approvalId,
            action: "approve",
            reason: body.reviewReason ?? null,
            metadata: {
              approvalAction: requestItem.action,
              executionResult,
            },
          });

          return {
            approved,
            executionResult,
          };
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể duyệt yêu cầu" };
        }
      })
      .patch("/:id/reject", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const approvalId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(approvalId) || approvalId <= 0) {
          set.status = 400;
          return { error: "ID yêu cầu duyệt không hợp lệ" };
        }

        try {
          const body = (await request.json().catch(() => ({}))) as { reviewReason?: string };
          const rejected = await new ApprovalsService(db).rejectRequest(
            approvalId,
            organization.id,
            user.id,
            body.reviewReason,
          );

          if (!rejected) {
            set.status = 404;
            return { error: "Không tìm thấy yêu cầu duyệt" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "approval_request",
            entityId: approvalId,
            action: "reject",
            reason: body.reviewReason ?? null,
            metadata: {
              approvalAction: rejected.action,
            },
          });

          return rejected;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể từ chối yêu cầu" };
        }
      }),
  );
