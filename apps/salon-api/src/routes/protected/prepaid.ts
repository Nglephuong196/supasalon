import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import { ActivityLogsService, PrepaidService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

export const prepaidProtectedRoutes = new Elysia({ name: "protected-prepaid-routes" })
  .use(protectedPlugin)
  .group("/prepaid", (app) =>
    app
      .get("/plans", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
        return new PrepaidService(db).listPlans(organization.id);
      })
      .post("/plans", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );
        try {
          const body = (await request.json()) as {
            name: string;
            description?: string;
            unit: "vnd" | "credit";
            salePrice: number;
            initialBalance: number;
            expiryDays: number;
            isActive?: boolean;
          };

          const created = await new PrepaidService(db).createPlan(organization.id, body);
          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: created.id,
            action: "create_plan",
          });
          set.status = 201;
          return created;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo gói trả trước" };
        }
      })
      .put("/plans/:id", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );
        const planId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(planId) || planId <= 0) {
          set.status = 400;
          return { error: "ID gói không hợp lệ" };
        }

        try {
          const body = (await request.json()) as {
            name?: string;
            description?: string;
            unit?: "vnd" | "credit";
            salePrice?: number;
            initialBalance?: number;
            expiryDays?: number;
            isActive?: boolean;
          };
          const updated = await new PrepaidService(db).updatePlan(planId, organization.id, body);
          if (!updated) {
            set.status = 404;
            return { error: "Không tìm thấy gói" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: updated.id,
            action: "update_plan",
          });

          return updated;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật gói" };
        }
      })
      .delete("/plans/:id", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );
        const planId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(planId) || planId <= 0) {
          set.status = 400;
          return { error: "ID gói không hợp lệ" };
        }

        try {
          const deleted = await new PrepaidService(db).deletePlan(planId, organization.id);
          if (!deleted) {
            set.status = 404;
            return { error: "Không tìm thấy gói" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: deleted.id,
            action: "delete_plan",
          });

          return { message: "Đã xóa gói" };
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể xóa gói" };
        }
      })
      .get("/cards", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const customerId = query.get("customerId")
            ? Number.parseInt(query.get("customerId") as string, 10)
            : undefined;
          const status = query.get("status");
          return new PrepaidService(db).listCards(organization.id, {
            customerId,
            status:
              status === "active" || status === "expired" || status === "cancelled"
                ? status
                : undefined,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải thẻ trả trước" };
        }
      })
      .get("/cards/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
        const cardId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(cardId) || cardId <= 0) {
          set.status = 400;
          return { error: "ID thẻ không hợp lệ" };
        }

        const card = await new PrepaidService(db).findCardById(cardId, organization.id);
        if (!card) {
          set.status = 404;
          return { error: "Không tìm thấy thẻ" };
        }
        return card;
      })
      .post("/cards", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );

        try {
          const body = (await request.json()) as {
            customerId: number;
            planId?: number;
            cardCode?: string;
            unit?: "vnd" | "credit";
            purchasePrice?: number;
            initialBalance?: number;
            expiredAt?: string;
            notes?: string;
          };

          const card = await new PrepaidService(db).createCard(organization.id, user.id, {
            customerId: Number(body.customerId),
            planId: body.planId,
            cardCode: body.cardCode,
            unit: body.unit,
            purchasePrice: body.purchasePrice,
            initialBalance: body.initialBalance,
            expiredAt: body.expiredAt ? parseDateInput(body.expiredAt, "Ngày hết hạn") : null,
            notes: body.notes,
          });

          if (!card) {
            set.status = 500;
            return { error: "Không thể tạo thẻ" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: card.id,
            action: "create_card",
            metadata: {
              customerId: card.customerId,
              remainingBalance: card.remainingBalance,
              unit: card.unit,
            },
          });

          set.status = 201;
          return card;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo thẻ trả trước" };
        }
      })
      .post("/cards/:id/consume", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );
        const cardId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(cardId) || cardId <= 0) {
          set.status = 400;
          return { error: "ID thẻ không hợp lệ" };
        }

        try {
          const body = (await request.json()) as {
            amount: number;
            invoiceId?: number;
            notes?: string;
          };
          const result = await new PrepaidService(db).consumeCard(organization.id, user.id, {
            cardId,
            amount: Number(body.amount),
            invoiceId: body.invoiceId,
            notes: body.notes,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: cardId,
            action: "consume",
            reason: body.notes ?? null,
            metadata: {
              amount: body.amount,
              invoiceId: body.invoiceId ?? null,
              balanceAfter: result.card.remainingBalance,
            },
          });

          return result;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể trừ thẻ" };
        }
      })
      .post("/cards/:id/topup", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.CUSTOMER,
          ACTIONS.UPDATE,
        );
        const cardId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(cardId) || cardId <= 0) {
          set.status = 400;
          return { error: "ID thẻ không hợp lệ" };
        }

        try {
          const body = (await request.json()) as {
            amount: number;
            notes?: string;
          };
          const result = await new PrepaidService(db).topupCard(organization.id, user.id, {
            cardId,
            amount: Number(body.amount),
            notes: body.notes,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "prepaid_card",
            entityId: cardId,
            action: "topup",
            reason: body.notes ?? null,
            metadata: {
              amount: body.amount,
              balanceAfter: result.card.remainingBalance,
            },
          });

          return result;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể nạp thêm vào thẻ" };
        }
      })
      .get("/transactions", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const cardId = query.get("cardId") ? Number.parseInt(query.get("cardId") as string, 10) : undefined;
          const customerId = query.get("customerId")
            ? Number.parseInt(query.get("customerId") as string, 10)
            : undefined;
          const from = query.get("from") ? parseDateInput(query.get("from"), "Ngày bắt đầu") : undefined;
          const to = query.get("to") ? parseDateInput(query.get("to"), "Ngày kết thúc") : undefined;

          return new PrepaidService(db).listTransactions(organization.id, {
            cardId,
            customerId,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải giao dịch thẻ trả trước" };
        }
      }),
  );
