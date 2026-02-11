import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { ActivityLogsService, PayrollService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseId(value: string, label: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} không hợp lệ`);
  }
  return parsed;
}

function parseOptionalDate(value: unknown, label: string) {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

function parseRequiredDate(value: unknown, label: string) {
  const date = parseOptionalDate(value, label);
  if (!date) {
    throw new Error(`${label} là bắt buộc`);
  }
  return date;
}

export const payrollProtectedRoutes = new Elysia({
  name: "protected-payroll-routes",
})
  .use(protectedPlugin)
  .group("/payroll", (app) =>
    app
      .get("/configs", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const url = new URL(request.url);
          const branchIdParam = url.searchParams.get("branchId");
          const staffId = url.searchParams.get("staffId") || undefined;
          const branchId = branchIdParam ? parseId(branchIdParam, "branchId") : undefined;
          return new PayrollService(db).listConfigs(organization.id, {
            branchId,
            staffId,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải cấu hình lương" };
        }
      })
      .post("/configs", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.REPORT,
          ACTIONS.UPDATE,
        );

        try {
          const body = (await request.json()) as {
            id?: number;
            staffId: string;
            branchId?: number;
            salaryType?: "monthly" | "daily" | "hourly";
            baseSalary?: number;
            defaultAllowance?: number;
            defaultDeduction?: number;
            defaultAdvance?: number;
            paymentMethod?: "cash" | "transfer" | "card";
            effectiveFrom?: string;
            isActive?: boolean;
            notes?: string;
          };

          const saved = await new PayrollService(db).saveConfig(organization.id, {
            id: body.id,
            staffId: body.staffId,
            branchId: typeof body.branchId === "number" ? body.branchId : undefined,
            salaryType: body.salaryType,
            baseSalary: body.baseSalary,
            defaultAllowance: body.defaultAllowance,
            defaultDeduction: body.defaultDeduction,
            defaultAdvance: body.defaultAdvance,
            paymentMethod: body.paymentMethod,
            effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
            isActive: body.isActive,
            notes: body.notes,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "payroll_item",
            entityId: saved.id,
            action: body.id ? "update_config" : "create_config",
            metadata: {
              staffId: saved.staffId,
              branchId: saved.branchId,
              baseSalary: saved.baseSalary,
              paymentMethod: saved.paymentMethod,
            },
          });

          if (!body.id) set.status = 201;
          return saved;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể lưu cấu hình lương" };
        }
      })
      .get("/cycles", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const url = new URL(request.url);
          const branchIdParam = url.searchParams.get("branchId");
          const status = url.searchParams.get("status") as
            | "draft"
            | "finalized"
            | "paid"
            | null;
          const from = parseOptionalDate(url.searchParams.get("from"), "Ngày bắt đầu");
          const to = parseOptionalDate(url.searchParams.get("to"), "Ngày kết thúc");

          return new PayrollService(db).listCycles(organization.id, {
            branchId: branchIdParam ? parseId(branchIdParam, "branchId") : undefined,
            status: status ?? undefined,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải danh sách kỳ lương" };
        }
      })
      .post("/cycles/preview", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const body = (await request.json()) as {
            from: string;
            to: string;
            branchId?: number;
          };

          const preview = await new PayrollService(db).previewCycle(organization.id, {
            from: parseRequiredDate(body.from, "Ngày bắt đầu"),
            to: parseRequiredDate(body.to, "Ngày kết thúc"),
            branchId: typeof body.branchId === "number" ? body.branchId : undefined,
          });

          return preview;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể xem trước kỳ lương" };
        }
      })
      .post("/cycles", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.REPORT,
          ACTIONS.UPDATE,
        );
        try {
          const body = (await request.json()) as {
            from: string;
            to: string;
            branchId?: number;
            name?: string;
            notes?: string;
          };

          const created = await new PayrollService(db).createCycle(organization.id, user.id, {
            from: parseRequiredDate(body.from, "Ngày bắt đầu"),
            to: parseRequiredDate(body.to, "Ngày kết thúc"),
            branchId: typeof body.branchId === "number" ? body.branchId : undefined,
            name: body.name,
            notes: body.notes,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "payroll_cycle",
            entityId: created.id,
            action: "create_cycle",
            metadata: {
              branchId: created.branchId,
              from: created.fromDate,
              to: created.toDate,
              itemCount: created.items?.length ?? 0,
            },
          });

          set.status = 201;
          return created;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo kỳ lương" };
        }
      })
      .get("/cycles/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const cycleId = parseId(params.id, "ID kỳ lương");
          const cycle = await new PayrollService(db).getCycle(organization.id, cycleId);
          if (!cycle) {
            set.status = 404;
            return { error: "Không tìm thấy kỳ lương" };
          }
          return cycle;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải kỳ lương" };
        }
      })
      .get("/cycles/:id/items", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.REPORT, ACTIONS.READ);
        try {
          const cycleId = parseId(params.id, "ID kỳ lương");
          return new PayrollService(db).listItems(organization.id, cycleId);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải dòng lương" };
        }
      })
      .patch("/items/:id", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.REPORT,
          ACTIONS.UPDATE,
        );

        try {
          const itemId = parseId(params.id, "ID dòng lương");
          const body = (await request.json()) as {
            bonusAmount?: number;
            allowanceAmount?: number;
            deductionAmount?: number;
            advanceAmount?: number;
            notes?: string;
            paymentMethod?: "cash" | "transfer" | "card";
          };
          const updated = await new PayrollService(db).updateItem(organization.id, itemId, body);
          if (!updated) {
            set.status = 404;
            return { error: "Không tìm thấy dòng lương" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "payroll_item",
            entityId: updated.id,
            action: "update_item",
            metadata: {
              netAmount: updated.netAmount,
              bonusAmount: updated.bonusAmount,
              allowanceAmount: updated.allowanceAmount,
              deductionAmount: updated.deductionAmount,
              advanceAmount: updated.advanceAmount,
            },
          });

          return updated;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật dòng lương" };
        }
      })
      .patch("/cycles/:id/finalize", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.REPORT,
          ACTIONS.UPDATE,
        );

        try {
          const cycleId = parseId(params.id, "ID kỳ lương");
          const finalized = await new PayrollService(db).finalizeCycle(
            organization.id,
            cycleId,
            user.id,
          );
          if (!finalized) {
            set.status = 404;
            return { error: "Không tìm thấy kỳ lương" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "payroll_cycle",
            entityId: finalized.id,
            action: "finalize_cycle",
            metadata: {
              status: finalized.status,
            },
          });

          return finalized;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể chốt kỳ lương" };
        }
      })
      .patch("/cycles/:id/pay", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.REPORT,
          ACTIONS.UPDATE,
        );

        try {
          const cycleId = parseId(params.id, "ID kỳ lương");
          const body = (await request.json().catch(() => ({}))) as { paidAt?: string };

          const paid = await new PayrollService(db).payCycle(organization.id, cycleId, user.id, {
            paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
          });

          if (!paid) {
            set.status = 404;
            return { error: "Không tìm thấy kỳ lương" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "payroll_cycle",
            entityId: paid.id,
            action: "pay_cycle",
            metadata: {
              paidAt: paid.paidAt,
              status: paid.status,
              itemCount: paid.items?.length ?? 0,
            },
          });

          return paid;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể chi trả kỳ lương" };
        }
      }),
  );
