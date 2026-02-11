import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import type { Database } from "../db";
import { invoiceItemStaff, invoiceItems, invoices, member, staffCommissionPayouts, user } from "../db";

export type CommissionPayoutPreviewItem = {
  staffId: string;
  staffName: string;
  totalAmount: number;
  totalItems: number;
};

export class CommissionPayoutsService {
  constructor(private db: Database) {}

  private calcCommissionAmount(row: {
    itemTotal: number | null;
    commissionType: string | null;
    commissionValue: number | null;
    bonus: number | null;
  }) {
    const itemTotal = Number(row.itemTotal ?? 0);
    const commissionValue = Number(row.commissionValue ?? 0);
    const bonus = Number(row.bonus ?? 0);

    if (row.commissionType === "fixed") {
      return commissionValue + bonus;
    }
    return itemTotal * (commissionValue / 100) + bonus;
  }

  async previewByRange(organizationId: string, from: Date, to: Date) {
    const rows = await this.db
      .select({
        staffId: invoiceItemStaff.staffId,
        itemTotal: invoiceItems.total,
        commissionType: invoiceItemStaff.commissionType,
        commissionValue: invoiceItemStaff.commissionValue,
        bonus: invoiceItemStaff.bonus,
      })
      .from(invoiceItemStaff)
      .innerJoin(invoiceItems, eq(invoiceItemStaff.invoiceItemId, invoiceItems.id))
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.organizationId, organizationId),
          eq(invoices.status, "paid"),
          gte(invoices.createdAt, from),
          lte(invoices.createdAt, to),
        ),
      );

    const grouped = new Map<string, { totalAmount: number; totalItems: number }>();
    for (const row of rows) {
      const current = grouped.get(row.staffId) ?? { totalAmount: 0, totalItems: 0 };
      current.totalAmount += this.calcCommissionAmount(row);
      current.totalItems += 1;
      grouped.set(row.staffId, current);
    }

    const staffIds = Array.from(grouped.keys());
    if (staffIds.length === 0) return [] as CommissionPayoutPreviewItem[];

    const staffs = await this.db
      .select({
        staffId: member.id,
        name: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(eq(member.organizationId, organizationId), inArray(member.id, staffIds)));

    const nameMap = new Map(staffs.map((staff) => [staff.staffId, staff.name]));

    return staffIds
      .map((staffId) => ({
        staffId,
        staffName: nameMap.get(staffId) ?? staffId,
        totalAmount: Number((grouped.get(staffId)?.totalAmount ?? 0).toFixed(2)),
        totalItems: grouped.get(staffId)?.totalItems ?? 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async createPayoutCycle(organizationId: string, from: Date, to: Date, notes?: string) {
    const existing = await this.db.query.staffCommissionPayouts.findFirst({
      where: and(
        eq(staffCommissionPayouts.organizationId, organizationId),
        eq(staffCommissionPayouts.fromDate, from),
        eq(staffCommissionPayouts.toDate, to),
      ),
    });
    if (existing) {
      throw new Error("Kỳ chi hoa hồng này đã tồn tại");
    }

    const preview = await this.previewByRange(organizationId, from, to);
    if (preview.length === 0) return [];

    const created = await this.db
      .insert(staffCommissionPayouts)
      .values(
        preview.map((row) => ({
          organizationId,
          staffId: row.staffId,
          fromDate: from,
          toDate: to,
          totalAmount: row.totalAmount,
          status: "draft" as const,
          notes: notes ?? null,
        })),
      )
      .returning();

    return created;
  }

  async list(organizationId: string, from?: Date, to?: Date) {
    const conditions = [eq(staffCommissionPayouts.organizationId, organizationId)];
    if (from) conditions.push(gte(staffCommissionPayouts.fromDate, from));
    if (to) conditions.push(lte(staffCommissionPayouts.toDate, to));

    return this.db.query.staffCommissionPayouts.findMany({
      where: and(...conditions),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(staffCommissionPayouts.createdAt)],
    });
  }

  async markAsPaid(organizationId: string, payoutId: number) {
    const [updated] = await this.db
      .update(staffCommissionPayouts)
      .set({
        status: "paid",
        paidAt: new Date(),
      })
      .where(
        and(
          eq(staffCommissionPayouts.id, payoutId),
          eq(staffCommissionPayouts.organizationId, organizationId),
        ),
      )
      .returning();
    return updated;
  }

  async exportCsv(organizationId: string, from: Date, to: Date) {
    const rows = await this.previewByRange(organizationId, from, to);
    const headers = ["staff_id", "staff_name", "total_items", "total_amount"];
    const csvRows = rows.map((row) =>
      [row.staffId, row.staffName, String(row.totalItems), String(row.totalAmount)].join(","),
    );
    return [headers.join(","), ...csvRows].join("\n");
  }
}
