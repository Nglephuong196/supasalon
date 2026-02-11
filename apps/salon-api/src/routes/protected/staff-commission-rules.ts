import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import { StaffCommissionRulesService, type CommissionItemType, type CommissionType, type UpsertCommissionRuleInput } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

function isCommissionType(value: string): value is CommissionType {
  return value === "percent" || value === "fixed";
}

function isItemType(value: string): value is CommissionItemType {
  return value === "service" || value === "product";
}

function validateRuleInput(input: any): UpsertCommissionRuleInput {
  const staffId = String(input?.staffId || "").trim();
  const itemType = String(input?.itemType || "").trim();
  const itemId = Number(input?.itemId);
  const commissionType = String(input?.commissionType || "").trim();
  const commissionValue = Number(input?.commissionValue);

  if (!staffId) throw new Error("Thiếu staffId");
  if (!isItemType(itemType)) throw new Error("itemType không hợp lệ");
  if (!Number.isInteger(itemId) || itemId <= 0) throw new Error("itemId không hợp lệ");
  if (!isCommissionType(commissionType)) throw new Error("commissionType không hợp lệ");
  if (!Number.isFinite(commissionValue) || commissionValue < 0) throw new Error("commissionValue không hợp lệ");

  return { staffId, itemType, itemId, commissionType, commissionValue };
}

export const staffCommissionRulesProtectedRoutes = new Elysia({ name: "protected-staff-commission-rules-routes" })
  .use(protectedPlugin)
  .group("/staff-commission-rules", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.READ);
        const query = getQuery(request);
        const filters: { staffId?: string; itemType?: CommissionItemType } = {};
        const staffIdQuery = query.get("staffId");
        const itemTypeQuery = query.get("itemType");
        if (staffIdQuery) filters.staffId = staffIdQuery;
        if (itemTypeQuery && isItemType(itemTypeQuery)) filters.itemType = itemTypeQuery;
        return new StaffCommissionRulesService(db).findAll(organization.id, filters);
      })
      .post("/upsert", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.UPDATE);
        try {
          const input = validateRuleInput(await request.json());
          return new StaffCommissionRulesService(db).upsert(input, organization.id);
        } catch (error: any) {
          set.status = 400;
          return { error: error.message || "Không thể lưu cấu hình" };
        }
      })
      .post("/bulk-upsert", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.UPDATE);
        try {
          const body = await request.json() as { rules?: unknown[] };
          const inputRules = Array.isArray(body.rules) ? body.rules : [];
          if (inputRules.length === 0) {
            set.status = 400;
            return { error: "Danh sách rules rỗng" };
          }
          if (inputRules.length > 500) {
            set.status = 400;
            return { error: "Tối đa 500 rules mỗi lần" };
          }
          const validatedRules = inputRules.map((rule) => validateRuleInput(rule));
          const results = await new StaffCommissionRulesService(db).upsertMany(validatedRules, organization.id);
          return { rules: results };
        } catch (error: any) {
          set.status = 400;
          return { error: error.message || "Không thể lưu hàng loạt" };
        }
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.UPDATE);
        const id = Number(params.id);
        if (!Number.isInteger(id) || id <= 0) {
          set.status = 400;
          return { error: "ID không hợp lệ" };
        }
        const deleted = await new StaffCommissionRulesService(db).delete(id, organization.id);
        if (!deleted) {
          set.status = 404;
          return { error: "Không tìm thấy rule" };
        }
        return { success: true };
      }),
  );
