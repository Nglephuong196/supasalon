import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { ActivityLogsService, CommissionPayoutsService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

export const commissionPayoutsProtectedRoutes = new Elysia({
  name: "protected-commission-payouts-routes",
})
  .use(protectedPlugin)
  .group("/commission-payouts", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        const url = new URL(request.url);
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        const service = new CommissionPayoutsService(db);
        return service.list(
          organization.id,
          from ? parseDateInput(from, "Ngày bắt đầu") : undefined,
          to ? parseDateInput(to, "Ngày kết thúc") : undefined,
        );
      })
      .post("/preview", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const body = (await request.json()) as { from: string; to: string };
          const from = parseDateInput(body.from, "Ngày bắt đầu");
          const to = parseDateInput(body.to, "Ngày kết thúc");
          return new CommissionPayoutsService(db).previewByRange(organization.id, from, to);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Dữ liệu không hợp lệ" };
        }
      })
      .post("/", async ({ request, set }) => {
        const {
          organization,
          user,
        } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        try {
          const body = (await request.json()) as { from: string; to: string; notes?: string };
          const from = parseDateInput(body.from, "Ngày bắt đầu");
          const to = parseDateInput(body.to, "Ngày kết thúc");
          const created = await new CommissionPayoutsService(db).createPayoutCycle(
            organization.id,
            from,
            to,
            body.notes,
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "commission_payout",
            entityId: null,
            action: "create_cycle",
            reason: body.notes ?? null,
            metadata: {
              from: from.toISOString(),
              to: to.toISOString(),
              count: created.length,
            },
          });

          return created;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo kỳ chi hoa hồng" };
        }
      })
      .patch("/:id/pay", async ({ request, params, set }) => {
        const {
          organization,
          user,
        } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.UPDATE);
        const payoutId = Number.parseInt(params.id, 10);
        if (!Number.isInteger(payoutId) || payoutId <= 0) {
          set.status = 400;
          return { error: "ID không hợp lệ" };
        }

        const updated = await new CommissionPayoutsService(db).markAsPaid(organization.id, payoutId);
        if (!updated) {
          set.status = 404;
          return { error: "Không tìm thấy kỳ chi hoa hồng" };
        }

        await new ActivityLogsService(db).log({
          organizationId: organization.id,
          actorUserId: user.id,
          entityType: "commission_payout",
          entityId: updated.id,
          action: "mark_paid",
          metadata: {
            totalAmount: updated.totalAmount,
          },
        });

        return updated;
      })
      .get("/export", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        const url = new URL(request.url);
        const fromParam = url.searchParams.get("from");
        const toParam = url.searchParams.get("to");

        if (!fromParam || !toParam) {
          set.status = 400;
          return { error: "Thiếu from/to" };
        }

        const csv = await new CommissionPayoutsService(db).exportCsv(
          organization.id,
          parseDateInput(fromParam, "Ngày bắt đầu"),
          parseDateInput(toParam, "Ngày kết thúc"),
        );
        set.headers["content-type"] = "text/csv; charset=utf-8";
        set.headers["content-disposition"] = "attachment; filename=commission-payouts.csv";
        return csv;
      }),
  );
