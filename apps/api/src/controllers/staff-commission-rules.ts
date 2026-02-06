import { Hono } from "hono";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { requirePermission } from "../middleware/permission";
import type { Database } from "../db";
import {
  StaffCommissionRulesService,
  type CommissionType,
  type CommissionItemType,
  type UpsertCommissionRuleInput,
} from "../services/staff-commission-rules";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

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

  if (!staffId) {
    throw new Error("Thiếu staffId");
  }

  if (!isItemType(itemType)) {
    throw new Error("itemType không hợp lệ");
  }

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("itemId không hợp lệ");
  }

  if (!isCommissionType(commissionType)) {
    throw new Error("commissionType không hợp lệ");
  }

  if (!Number.isFinite(commissionValue) || commissionValue < 0) {
    throw new Error("commissionValue không hợp lệ");
  }

  return {
    staffId,
    itemType,
    itemId,
    commissionType,
    commissionValue,
  };
}

export const staffCommissionRulesController = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

staffCommissionRulesController.get(
  "/",
  requirePermission(RESOURCES.EMPLOYEE, ACTIONS.READ),
  async (c) => {
    const service = new StaffCommissionRulesService(c.get("db"));
    const organization = c.get("organization");

    const staffIdQuery = c.req.query("staffId");
    const itemTypeQuery = c.req.query("itemType");

    const filters: { staffId?: string; itemType?: CommissionItemType } = {};

    if (staffIdQuery) {
      filters.staffId = staffIdQuery;
    }

    if (itemTypeQuery && isItemType(itemTypeQuery)) {
      filters.itemType = itemTypeQuery;
    }

    const rules = await service.findAll(organization.id, filters);
    return c.json(rules);
  },
);

staffCommissionRulesController.post(
  "/upsert",
  requirePermission(RESOURCES.EMPLOYEE, ACTIONS.UPDATE),
  async (c) => {
    const service = new StaffCommissionRulesService(c.get("db"));
    const organization = c.get("organization");

    try {
      const body = await c.req.json();
      const input = validateRuleInput(body);
      const rule = await service.upsert(input, organization.id);
      return c.json(rule);
    } catch (error: any) {
      return c.json({ error: error.message || "Không thể lưu cấu hình" }, 400);
    }
  },
);

staffCommissionRulesController.post(
  "/bulk-upsert",
  requirePermission(RESOURCES.EMPLOYEE, ACTIONS.UPDATE),
  async (c) => {
    const service = new StaffCommissionRulesService(c.get("db"));
    const organization = c.get("organization");

    try {
      const body = await c.req.json<{ rules?: unknown[] }>();
      const inputRules = Array.isArray(body.rules) ? body.rules : [];

      if (inputRules.length === 0) {
        return c.json({ error: "Danh sách rules rỗng" }, 400);
      }

      if (inputRules.length > 500) {
        return c.json({ error: "Tối đa 500 rules mỗi lần" }, 400);
      }

      const validatedRules = inputRules.map((rule) => validateRuleInput(rule));
      const results = await service.upsertMany(validatedRules, organization.id);
      return c.json({ rules: results });
    } catch (error: any) {
      return c.json({ error: error.message || "Không thể lưu hàng loạt" }, 400);
    }
  },
);

staffCommissionRulesController.delete(
  "/:id",
  requirePermission(RESOURCES.EMPLOYEE, ACTIONS.UPDATE),
  async (c) => {
    const service = new StaffCommissionRulesService(c.get("db"));
    const organization = c.get("organization");
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: "ID không hợp lệ" }, 400);
    }

    const deleted = await service.delete(id, organization.id);
    if (!deleted) {
      return c.json({ error: "Không tìm thấy rule" }, 404);
    }

    return c.json({ success: true });
  },
);
