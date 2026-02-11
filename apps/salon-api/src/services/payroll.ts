import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  ne,
  sql,
} from "drizzle-orm";

import type { Database } from "../db";
import {
  branches,
  invoiceItemStaff,
  invoiceItems,
  invoices,
  member,
  memberBranches,
  payrollConfigs,
  payrollCycles,
  payrollItems,
} from "../db";

export type PayrollPaymentMethod = "cash" | "transfer" | "card";
export type PayrollSalaryType = "monthly" | "daily" | "hourly";

export type PayrollConfigInput = {
  id?: number;
  staffId: string;
  branchId?: number | null;
  salaryType?: PayrollSalaryType;
  baseSalary?: number;
  defaultAllowance?: number;
  defaultDeduction?: number;
  defaultAdvance?: number;
  paymentMethod?: PayrollPaymentMethod;
  effectiveFrom?: Date;
  isActive?: boolean;
  notes?: string | null;
};

export type PayrollPreviewInput = {
  from: Date;
  to: Date;
  branchId?: number | null;
};

export type PayrollPreviewItem = {
  staffId: string;
  staffName: string;
  branchId: number | null;
  configId: number | null;
  salaryType: PayrollSalaryType;
  paymentMethod: PayrollPaymentMethod;
  baseSalary: number;
  commissionAmount: number;
  bonusAmount: number;
  allowanceAmount: number;
  deductionAmount: number;
  advanceAmount: number;
  netAmount: number;
};

function normalizeDate(value: Date, endOfDay = false) {
  const normalized = new Date(value);
  if (endOfDay) {
    normalized.setHours(23, 59, 59, 999);
  } else {
    normalized.setHours(0, 0, 0, 0);
  }
  return normalized;
}

export class PayrollService {
  constructor(private db: Database) {}

  private toAmount(value: unknown) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return 0;
    return Number(amount.toFixed(2));
  }

  private calcNetAmount(input: {
    baseSalary: number;
    commissionAmount: number;
    bonusAmount: number;
    allowanceAmount: number;
    deductionAmount: number;
    advanceAmount: number;
  }) {
    const total =
      this.toAmount(input.baseSalary) +
      this.toAmount(input.commissionAmount) +
      this.toAmount(input.bonusAmount) +
      this.toAmount(input.allowanceAmount) -
      this.toAmount(input.deductionAmount) -
      this.toAmount(input.advanceAmount);
    return Number(total.toFixed(2));
  }

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

  private async ensureBranchInOrganization(organizationId: string, branchId?: number | null) {
    if (!branchId) return null;
    const found = await this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)),
    });
    if (!found) {
      throw new Error("Chi nhánh không hợp lệ");
    }
    return found;
  }

  private async ensureStaffInOrganization(organizationId: string, staffId: string) {
    const found = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, organizationId), eq(member.id, staffId)),
    });
    if (!found) {
      throw new Error("Nhân viên không thuộc salon");
    }
    return found;
  }

  private async listTargetStaff(organizationId: string, branchId?: number | null) {
    if (branchId) {
      const rows = await this.db.query.memberBranches.findMany({
        where: and(
          eq(memberBranches.organizationId, organizationId),
          eq(memberBranches.branchId, branchId),
        ),
        with: {
          member: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(memberBranches.isPrimary), asc(memberBranches.createdAt)],
      });

      const unique = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        if (!unique.has(row.memberId)) {
          unique.set(row.memberId, row);
        }
      }
      return Array.from(unique.values()).map((row) => ({
        staffId: row.memberId,
        staffName: row.member.user?.name ?? row.member.user?.email ?? row.member.id,
      }));
    }

    const rows = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, organizationId), ne(member.role, "owner")),
      with: {
        user: true,
      },
      orderBy: [asc(member.createdAt)],
    });

    return rows.map((row) => ({
      staffId: row.id,
      staffName: row.user?.name ?? row.user?.email ?? row.id,
    }));
  }

  private async resolveConfigForStaff(
    organizationId: string,
    staffId: string,
    toDate: Date,
    branchId?: number | null,
  ) {
    const configs = await this.db.query.payrollConfigs.findMany({
      where: and(
        eq(payrollConfigs.organizationId, organizationId),
        eq(payrollConfigs.staffId, staffId),
        eq(payrollConfigs.isActive, true),
        lte(payrollConfigs.effectiveFrom, toDate),
      ),
      orderBy: [desc(payrollConfigs.effectiveFrom), desc(payrollConfigs.createdAt)],
    });

    if (configs.length === 0) return null;

    if (branchId) {
      return (
        configs.find((item) => Number(item.branchId ?? 0) === branchId) ??
        configs.find((item) => item.branchId === null) ??
        configs[0]
      );
    }

    return configs.find((item) => item.branchId === null) ?? configs[0];
  }

  private async buildCommissionMap(
    organizationId: string,
    from: Date,
    to: Date,
    branchId?: number | null,
  ) {
    const conditions = [
      eq(invoices.organizationId, organizationId),
      eq(invoices.status, "paid"),
      gte(invoices.createdAt, from),
      lte(invoices.createdAt, to),
    ];

    if (branchId) {
      conditions.push(eq(invoices.branchId, branchId));
    }

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
      .where(and(...conditions));

    const grouped = new Map<string, number>();
    for (const row of rows) {
      const current = grouped.get(row.staffId) ?? 0;
      grouped.set(row.staffId, current + this.calcCommissionAmount(row));
    }

    return grouped;
  }

  async listConfigs(
    organizationId: string,
    filters?: { branchId?: number | null; staffId?: string },
  ) {
    const conditions = [eq(payrollConfigs.organizationId, organizationId)];

    if (filters?.staffId) {
      conditions.push(eq(payrollConfigs.staffId, filters.staffId));
    }
    if (typeof filters?.branchId === "number") {
      conditions.push(eq(payrollConfigs.branchId, filters.branchId));
    }
    if (filters?.branchId === null) {
      conditions.push(isNull(payrollConfigs.branchId));
    }

    return this.db.query.payrollConfigs.findMany({
      where: and(...conditions),
      with: {
        branch: true,
        staff: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(payrollConfigs.effectiveFrom), desc(payrollConfigs.createdAt)],
    });
  }

  async saveConfig(organizationId: string, input: PayrollConfigInput) {
    await this.ensureStaffInOrganization(organizationId, input.staffId);
    await this.ensureBranchInOrganization(organizationId, input.branchId);

    const payload = {
      organizationId,
      staffId: input.staffId,
      branchId: input.branchId ?? null,
      salaryType: input.salaryType ?? "monthly",
      baseSalary: this.toAmount(input.baseSalary),
      defaultAllowance: this.toAmount(input.defaultAllowance),
      defaultDeduction: this.toAmount(input.defaultDeduction),
      defaultAdvance: this.toAmount(input.defaultAdvance),
      paymentMethod: input.paymentMethod ?? "transfer",
      effectiveFrom: input.effectiveFrom ?? new Date(),
      isActive: typeof input.isActive === "boolean" ? input.isActive : true,
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    };

    if (input.id) {
      const [updated] = await this.db
        .update(payrollConfigs)
        .set(payload)
        .where(
          and(
            eq(payrollConfigs.id, input.id),
            eq(payrollConfigs.organizationId, organizationId),
          ),
        )
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(payrollConfigs)
      .values({
        ...payload,
        createdAt: new Date(),
      })
      .returning();

    return created;
  }

  async previewCycle(organizationId: string, input: PayrollPreviewInput) {
    const from = normalizeDate(input.from);
    const to = normalizeDate(input.to, true);

    if (from.getTime() > to.getTime()) {
      throw new Error("Khoảng thời gian bảng lương không hợp lệ");
    }

    await this.ensureBranchInOrganization(organizationId, input.branchId);

    const staffRows = await this.listTargetStaff(organizationId, input.branchId);
    if (staffRows.length === 0) {
      return [] as PayrollPreviewItem[];
    }

    const commissionMap = await this.buildCommissionMap(organizationId, from, to, input.branchId);

    const items = await Promise.all(
      staffRows.map(async (staff) => {
        const config = await this.resolveConfigForStaff(
          organizationId,
          staff.staffId,
          to,
          input.branchId,
        );

        const baseSalary = this.toAmount(config?.baseSalary ?? 0);
        const commissionAmount = this.toAmount(commissionMap.get(staff.staffId) ?? 0);
        const bonusAmount = 0;
        const allowanceAmount = this.toAmount(config?.defaultAllowance ?? 0);
        const deductionAmount = this.toAmount(config?.defaultDeduction ?? 0);
        const advanceAmount = this.toAmount(config?.defaultAdvance ?? 0);
        const paymentMethod = (config?.paymentMethod ?? "transfer") as PayrollPaymentMethod;
        const salaryType = (config?.salaryType ?? "monthly") as PayrollSalaryType;

        return {
          staffId: staff.staffId,
          staffName: staff.staffName,
          branchId: input.branchId ?? null,
          configId: config?.id ?? null,
          salaryType,
          paymentMethod,
          baseSalary,
          commissionAmount,
          bonusAmount,
          allowanceAmount,
          deductionAmount,
          advanceAmount,
          netAmount: this.calcNetAmount({
            baseSalary,
            commissionAmount,
            bonusAmount,
            allowanceAmount,
            deductionAmount,
            advanceAmount,
          }),
        } satisfies PayrollPreviewItem;
      }),
    );

    return items.sort((a, b) => a.staffName.localeCompare(b.staffName, "vi"));
  }

  async createCycle(
    organizationId: string,
    actorUserId: string,
    input: PayrollPreviewInput & { name?: string; notes?: string | null },
  ) {
    const from = normalizeDate(input.from);
    const to = normalizeDate(input.to, true);

    const existing = await this.db.query.payrollCycles.findFirst({
      where: and(
        eq(payrollCycles.organizationId, organizationId),
        eq(payrollCycles.fromDate, from),
        eq(payrollCycles.toDate, to),
        typeof input.branchId === "number"
          ? eq(payrollCycles.branchId, input.branchId)
          : isNull(payrollCycles.branchId),
      ),
    });

    if (existing) {
      throw new Error("Kỳ lương này đã tồn tại");
    }

    const previewRows = await this.previewCycle(organizationId, {
      from,
      to,
      branchId: input.branchId ?? null,
    });

    if (previewRows.length === 0) {
      throw new Error("Không có nhân viên nào trong phạm vi kỳ lương");
    }

    const [cycle] = await this.db
      .insert(payrollCycles)
      .values({
        organizationId,
        branchId: input.branchId ?? null,
        name:
          input.name?.trim() ||
          `Bảng lương ${from.toLocaleDateString("vi-VN")} - ${to.toLocaleDateString("vi-VN")}`,
        fromDate: from,
        toDate: to,
        status: "draft",
        notes: input.notes?.trim() || null,
        createdByUserId: actorUserId,
      })
      .returning();

    await this.db.insert(payrollItems).values(
      previewRows.map((row) => ({
        organizationId,
        cycleId: cycle.id,
        staffId: row.staffId,
        branchId: row.branchId,
        baseSalary: row.baseSalary,
        commissionAmount: row.commissionAmount,
        bonusAmount: row.bonusAmount,
        allowanceAmount: row.allowanceAmount,
        deductionAmount: row.deductionAmount,
        advanceAmount: row.advanceAmount,
        netAmount: row.netAmount,
        paymentMethod: row.paymentMethod,
        status: "draft" as const,
        notes: null,
        metadata: row.configId
          ? {
              configId: row.configId,
              salaryType: row.salaryType,
            }
          : {
              salaryType: row.salaryType,
            },
      })),
    );

    const created = await this.getCycle(organizationId, cycle.id);
    if (!created) {
      throw new Error("Không thể tạo kỳ lương");
    }

    return created;
  }

  async listCycles(
    organizationId: string,
    filters?: {
      branchId?: number;
      status?: "draft" | "finalized" | "paid";
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(payrollCycles.organizationId, organizationId)];

    if (typeof filters?.branchId === "number") {
      conditions.push(eq(payrollCycles.branchId, filters.branchId));
    }
    if (filters?.status) {
      conditions.push(eq(payrollCycles.status, filters.status));
    }
    if (filters?.from) {
      conditions.push(gte(payrollCycles.fromDate, normalizeDate(filters.from)));
    }
    if (filters?.to) {
      conditions.push(lte(payrollCycles.toDate, normalizeDate(filters.to, true)));
    }

    return this.db.query.payrollCycles.findMany({
      where: and(...conditions),
      with: {
        branch: true,
        createdBy: true,
        finalizedBy: true,
        paidBy: true,
        items: true,
      },
      orderBy: [desc(payrollCycles.createdAt)],
    });
  }

  async getCycle(organizationId: string, cycleId: number) {
    return this.db.query.payrollCycles.findFirst({
      where: and(eq(payrollCycles.organizationId, organizationId), eq(payrollCycles.id, cycleId)),
      with: {
        branch: true,
        createdBy: true,
        finalizedBy: true,
        paidBy: true,
        items: {
          with: {
            staff: {
              with: {
                user: true,
              },
            },
            branch: true,
          },
          orderBy: [asc(payrollItems.createdAt)],
        },
      },
    });
  }

  async listItems(organizationId: string, cycleId: number) {
    return this.db.query.payrollItems.findMany({
      where: and(eq(payrollItems.organizationId, organizationId), eq(payrollItems.cycleId, cycleId)),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
        branch: true,
        cycle: true,
      },
      orderBy: [asc(payrollItems.createdAt)],
    });
  }

  async updateItem(
    organizationId: string,
    itemId: number,
    payload: {
      bonusAmount?: number;
      allowanceAmount?: number;
      deductionAmount?: number;
      advanceAmount?: number;
      notes?: string | null;
      paymentMethod?: PayrollPaymentMethod;
    },
  ) {
    const existing = await this.db.query.payrollItems.findFirst({
      where: and(eq(payrollItems.organizationId, organizationId), eq(payrollItems.id, itemId)),
    });

    if (!existing) return undefined;
    if (existing.status === "paid") {
      throw new Error("Không thể sửa dòng lương đã thanh toán");
    }

    const nextBonus =
      typeof payload.bonusAmount === "number"
        ? this.toAmount(payload.bonusAmount)
        : this.toAmount(existing.bonusAmount);
    const nextAllowance =
      typeof payload.allowanceAmount === "number"
        ? this.toAmount(payload.allowanceAmount)
        : this.toAmount(existing.allowanceAmount);
    const nextDeduction =
      typeof payload.deductionAmount === "number"
        ? this.toAmount(payload.deductionAmount)
        : this.toAmount(existing.deductionAmount);
    const nextAdvance =
      typeof payload.advanceAmount === "number"
        ? this.toAmount(payload.advanceAmount)
        : this.toAmount(existing.advanceAmount);

    const [updated] = await this.db
      .update(payrollItems)
      .set({
        bonusAmount: nextBonus,
        allowanceAmount: nextAllowance,
        deductionAmount: nextDeduction,
        advanceAmount: nextAdvance,
        paymentMethod: payload.paymentMethod ?? existing.paymentMethod,
        notes: typeof payload.notes === "string" ? payload.notes.trim() : existing.notes,
        netAmount: this.calcNetAmount({
          baseSalary: Number(existing.baseSalary ?? 0),
          commissionAmount: Number(existing.commissionAmount ?? 0),
          bonusAmount: nextBonus,
          allowanceAmount: nextAllowance,
          deductionAmount: nextDeduction,
          advanceAmount: nextAdvance,
        }),
        updatedAt: new Date(),
      })
      .where(and(eq(payrollItems.organizationId, organizationId), eq(payrollItems.id, itemId)))
      .returning();

    return updated;
  }

  async finalizeCycle(organizationId: string, cycleId: number, actorUserId: string) {
    const existing = await this.db.query.payrollCycles.findFirst({
      where: and(eq(payrollCycles.organizationId, organizationId), eq(payrollCycles.id, cycleId)),
    });
    if (!existing) return undefined;

    if (existing.status === "paid") {
      return this.getCycle(organizationId, cycleId);
    }

    const itemCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(payrollItems)
      .where(
        and(
          eq(payrollItems.organizationId, organizationId),
          eq(payrollItems.cycleId, cycleId),
        ),
      )
      .then((rows) => Number(rows[0]?.count ?? 0));

    if (itemCount === 0) {
      throw new Error("Kỳ lương chưa có dòng dữ liệu");
    }

    await this.db
      .update(payrollCycles)
      .set({
        status: "finalized",
        finalizedAt: new Date(),
        finalizedByUserId: actorUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(payrollCycles.organizationId, organizationId), eq(payrollCycles.id, cycleId)));

    return this.getCycle(organizationId, cycleId);
  }

  async payCycle(
    organizationId: string,
    cycleId: number,
    actorUserId: string,
    options?: {
      paidAt?: Date;
    },
  ) {
    const existing = await this.db.query.payrollCycles.findFirst({
      where: and(eq(payrollCycles.organizationId, organizationId), eq(payrollCycles.id, cycleId)),
    });
    if (!existing) return undefined;

    if (existing.status === "draft") {
      await this.finalizeCycle(organizationId, cycleId, actorUserId);
    }

    const paidAt = options?.paidAt ?? new Date();

    await this.db
      .update(payrollItems)
      .set({
        status: "paid",
        paidAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payrollItems.organizationId, organizationId),
          eq(payrollItems.cycleId, cycleId),
          ne(payrollItems.status, "paid"),
        ),
      );

    await this.db
      .update(payrollCycles)
      .set({
        status: "paid",
        paidAt,
        paidByUserId: actorUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(payrollCycles.organizationId, organizationId), eq(payrollCycles.id, cycleId)));

    return this.getCycle(organizationId, cycleId);
  }
}
