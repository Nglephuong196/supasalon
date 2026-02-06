import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../db";
import {
  member,
  productCategories,
  products,
  serviceCategories,
  services,
  staffCommissionRules,
} from "../db/schema";

export type CommissionItemType = "service" | "product";
export type CommissionType = "percent" | "fixed";

export type UpsertCommissionRuleInput = {
  staffId: string;
  itemType: CommissionItemType;
  itemId: number;
  commissionType: CommissionType;
  commissionValue: number;
};

export class StaffCommissionRulesService {
  constructor(private db: Database) {}

  async findAll(
    organizationId: string,
    filters?: { staffId?: string; itemType?: CommissionItemType },
  ) {
    const conditions = [eq(staffCommissionRules.organizationId, organizationId)];

    if (filters?.staffId) {
      conditions.push(eq(staffCommissionRules.staffId, filters.staffId));
    }

    if (filters?.itemType) {
      conditions.push(eq(staffCommissionRules.itemType, filters.itemType));
    }

    return this.db
      .select()
      .from(staffCommissionRules)
      .where(and(...conditions))
      .orderBy(
        asc(staffCommissionRules.staffId),
        asc(staffCommissionRules.itemType),
        asc(staffCommissionRules.itemId),
      );
  }

  async upsert(rule: UpsertCommissionRuleInput, organizationId: string) {
    await this.validateStaff(rule.staffId, organizationId);
    await this.validateItem(rule.itemType, rule.itemId, organizationId);

    const existing = await this.db
      .select()
      .from(staffCommissionRules)
      .where(
        and(
          eq(staffCommissionRules.organizationId, organizationId),
          eq(staffCommissionRules.staffId, rule.staffId),
          eq(staffCommissionRules.itemType, rule.itemType),
          eq(staffCommissionRules.itemId, rule.itemId),
        ),
      )
      .get();

    if (existing) {
      const updated = await this.db
        .update(staffCommissionRules)
        .set({
          commissionType: rule.commissionType,
          commissionValue: rule.commissionValue,
          updatedAt: new Date(),
        })
        .where(eq(staffCommissionRules.id, existing.id))
        .returning();

      return updated[0];
    }

    const created = await this.db
      .insert(staffCommissionRules)
      .values({
        organizationId,
        staffId: rule.staffId,
        itemType: rule.itemType,
        itemId: rule.itemId,
        commissionType: rule.commissionType,
        commissionValue: rule.commissionValue,
      })
      .returning();

    return created[0];
  }

  async upsertMany(rules: UpsertCommissionRuleInput[], organizationId: string) {
    const results = [];

    for (const rule of rules) {
      const saved = await this.upsert(rule, organizationId);
      results.push(saved);
    }

    return results;
  }

  async delete(id: number, organizationId: string) {
    const existing = await this.db
      .select()
      .from(staffCommissionRules)
      .where(
        and(
          eq(staffCommissionRules.id, id),
          eq(staffCommissionRules.organizationId, organizationId),
        ),
      )
      .get();

    if (!existing) return undefined;

    const deleted = await this.db
      .delete(staffCommissionRules)
      .where(eq(staffCommissionRules.id, id))
      .returning();

    return deleted[0];
  }

  private async validateStaff(staffId: string, organizationId: string) {
    const found = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(eq(member.id, staffId), eq(member.organizationId, organizationId)),
      )
      .get();

    if (!found) {
      throw new Error("Staff không thuộc tổ chức hiện tại");
    }
  }

  private async validateItem(
    itemType: CommissionItemType,
    itemId: number,
    organizationId: string,
  ) {
    if (itemType === "service") {
      const foundService = await this.db
        .select({ id: services.id })
        .from(services)
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(
          and(
            eq(services.id, itemId),
            eq(serviceCategories.organizationId, organizationId),
          ),
        )
        .get();

      if (!foundService) {
        throw new Error("Dịch vụ không thuộc tổ chức hiện tại");
      }

      return;
    }

    const foundProduct = await this.db
      .select({ id: products.id })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(
        and(
          eq(products.id, itemId),
          eq(productCategories.organizationId, organizationId),
        ),
      )
      .get();

    if (!foundProduct) {
      throw new Error("Sản phẩm không thuộc tổ chức hiện tại");
    }
  }
}
