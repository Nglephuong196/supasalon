import { and, desc, eq, gte, lte } from "drizzle-orm";

import type {
  Database,
  NewCustomerPrepaidCard,
  NewCustomerPrepaidTransaction,
  NewPrepaidPlan,
} from "../db";
import {
  customerPrepaidCards,
  customerPrepaidTransactions,
  prepaidPlans,
} from "../db";

export type PrepaidUnit = "vnd" | "credit";

export type PrepaidPlanInput = {
  name: string;
  description?: string | null;
  unit: PrepaidUnit;
  salePrice: number;
  initialBalance: number;
  expiryDays: number;
  isActive?: boolean;
};

export type CreatePrepaidCardInput = {
  customerId: number;
  planId?: number | null;
  cardCode?: string;
  unit?: PrepaidUnit;
  purchasePrice?: number;
  initialBalance?: number;
  expiredAt?: Date | string | null;
  notes?: string | null;
};

export type PrepaidCardTransactionType =
  | "purchase"
  | "consume"
  | "topup"
  | "adjust"
  | "expire"
  | "refund";

export class PrepaidService {
  constructor(private db: Database) {}

  private toNumber(value: unknown, label: string) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) {
      throw new Error(`${label} không hợp lệ`);
    }
    return Number(amount.toFixed(2));
  }

  private toPositive(value: unknown, label: string) {
    const amount = this.toNumber(value, label);
    if (amount <= 0) {
      throw new Error(`${label} phải lớn hơn 0`);
    }
    return amount;
  }

  private normalizeExpiry(date: unknown) {
    if (!date) return null;
    const parsed = date instanceof Date ? date : new Date(String(date));
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Ngày hết hạn không hợp lệ");
    }
    return parsed;
  }

  private randomCode() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PP-${stamp}-${rand}`;
  }

  async listPlans(organizationId: string) {
    return this.db.query.prepaidPlans.findMany({
      where: eq(prepaidPlans.organizationId, organizationId),
      orderBy: [desc(prepaidPlans.updatedAt)],
    });
  }

  async createPlan(organizationId: string, input: PrepaidPlanInput) {
    if (!input.name?.trim()) {
      throw new Error("Tên gói trả trước là bắt buộc");
    }

    const payload: NewPrepaidPlan = {
      organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unit: input.unit,
      salePrice: this.toNumber(input.salePrice, "Giá bán"),
      initialBalance: this.toPositive(input.initialBalance, "Giá trị gói"),
      expiryDays: Math.max(1, Math.trunc(Number(input.expiryDays ?? 90))),
      isActive: input.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await this.db.insert(prepaidPlans).values(payload).returning();
    return created;
  }

  async updatePlan(
    id: number,
    organizationId: string,
    input: Partial<PrepaidPlanInput>,
  ) {
    const existing = await this.db.query.prepaidPlans.findFirst({
      where: and(eq(prepaidPlans.id, id), eq(prepaidPlans.organizationId, organizationId)),
    });
    if (!existing) return undefined;

    const updates: Partial<NewPrepaidPlan> = {
      name: input.name !== undefined ? input.name.trim() : undefined,
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      unit: input.unit,
      salePrice:
        input.salePrice !== undefined ? this.toNumber(input.salePrice, "Giá bán") : undefined,
      initialBalance:
        input.initialBalance !== undefined
          ? this.toPositive(input.initialBalance, "Giá trị gói")
          : undefined,
      expiryDays:
        input.expiryDays !== undefined
          ? Math.max(1, Math.trunc(Number(input.expiryDays)))
          : undefined,
      isActive: input.isActive,
      updatedAt: new Date(),
    };

    if (updates.name !== undefined && !updates.name) {
      throw new Error("Tên gói trả trước là bắt buộc");
    }

    const [updated] = await this.db
      .update(prepaidPlans)
      .set(updates)
      .where(and(eq(prepaidPlans.id, id), eq(prepaidPlans.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async deletePlan(id: number, organizationId: string) {
    const hasCards = await this.db.query.customerPrepaidCards.findFirst({
      where: and(
        eq(customerPrepaidCards.organizationId, organizationId),
        eq(customerPrepaidCards.planId, id),
      ),
    });

    if (hasCards) {
      throw new Error("Không thể xóa gói đã phát sinh thẻ. Hãy chuyển sang trạng thái ngừng áp dụng.");
    }

    const [deleted] = await this.db
      .delete(prepaidPlans)
      .where(and(eq(prepaidPlans.id, id), eq(prepaidPlans.organizationId, organizationId)))
      .returning();

    return deleted;
  }

  async listCards(
    organizationId: string,
    filters?: {
      customerId?: number;
      status?: "active" | "expired" | "cancelled";
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(customerPrepaidCards.organizationId, organizationId)];

    if (filters?.customerId) {
      conditions.push(eq(customerPrepaidCards.customerId, filters.customerId));
    }
    if (filters?.status) {
      conditions.push(eq(customerPrepaidCards.status, filters.status));
    }
    if (filters?.from) {
      conditions.push(gte(customerPrepaidCards.purchasedAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(customerPrepaidCards.purchasedAt, filters.to));
    }

    return this.db.query.customerPrepaidCards.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        plan: true,
        createdBy: true,
      },
      orderBy: [desc(customerPrepaidCards.purchasedAt)],
    });
  }

  async findCardById(cardId: number, organizationId: string) {
    return this.db.query.customerPrepaidCards.findFirst({
      where: and(
        eq(customerPrepaidCards.id, cardId),
        eq(customerPrepaidCards.organizationId, organizationId),
      ),
      with: {
        customer: true,
        plan: true,
      },
    });
  }

  private async createTransaction(input: NewCustomerPrepaidTransaction) {
    const [created] = await this.db.insert(customerPrepaidTransactions).values(input).returning();
    return created;
  }

  async createCard(organizationId: string, actorUserId: string, input: CreatePrepaidCardInput) {
    const plan = input.planId
      ? await this.db.query.prepaidPlans.findFirst({
          where: and(
            eq(prepaidPlans.id, input.planId),
            eq(prepaidPlans.organizationId, organizationId),
          ),
        })
      : null;

    if (input.planId && !plan) {
      throw new Error("Không tìm thấy gói trả trước");
    }

    const unit = input.unit ?? plan?.unit ?? "vnd";
    const initialBalance = this.toPositive(
      input.initialBalance ?? plan?.initialBalance,
      "Giá trị thẻ",
    );
    const purchasePrice = this.toNumber(input.purchasePrice ?? plan?.salePrice ?? 0, "Giá bán");
    const now = new Date();

    const expiredAt =
      this.normalizeExpiry(input.expiredAt) ??
      (plan?.expiryDays
        ? new Date(now.getTime() + Math.max(1, plan.expiryDays) * 24 * 60 * 60 * 1000)
        : null);

    const payload: NewCustomerPrepaidCard = {
      organizationId,
      customerId: input.customerId,
      planId: plan?.id ?? null,
      cardCode: input.cardCode?.trim() || this.randomCode(),
      unit,
      purchasePrice,
      initialBalance,
      remainingBalance: initialBalance,
      status: "active",
      notes: input.notes?.trim() || null,
      purchasedAt: now,
      expiredAt,
      createdByUserId: actorUserId,
      createdAt: now,
      updatedAt: now,
    };

    const [created] = await this.db.insert(customerPrepaidCards).values(payload).returning();

    await this.createTransaction({
      organizationId,
      cardId: created.id,
      customerId: created.customerId,
      invoiceId: null,
      type: "purchase",
      amount: initialBalance,
      balanceAfter: initialBalance,
      notes: `Tạo thẻ mới - ${created.cardCode}`,
      metadata: {
        purchasePrice,
        planId: created.planId,
      },
      createdByUserId: actorUserId,
      createdAt: now,
    });

    return this.findCardById(created.id, organizationId);
  }

  async listTransactions(
    organizationId: string,
    filters?: {
      cardId?: number;
      customerId?: number;
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(customerPrepaidTransactions.organizationId, organizationId)];

    if (filters?.cardId) {
      conditions.push(eq(customerPrepaidTransactions.cardId, filters.cardId));
    }
    if (filters?.customerId) {
      conditions.push(eq(customerPrepaidTransactions.customerId, filters.customerId));
    }
    if (filters?.from) {
      conditions.push(gte(customerPrepaidTransactions.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(customerPrepaidTransactions.createdAt, filters.to));
    }

    return this.db.query.customerPrepaidTransactions.findMany({
      where: and(...conditions),
      with: {
        card: {
          with: {
            customer: true,
            plan: true,
          },
        },
        createdBy: true,
        invoice: true,
      },
      orderBy: [desc(customerPrepaidTransactions.createdAt)],
    });
  }

  async consumeCard(
    organizationId: string,
    actorUserId: string,
    input: {
      cardId: number;
      amount: number;
      invoiceId?: number | null;
      notes?: string;
    },
  ) {
    const card = await this.db.query.customerPrepaidCards.findFirst({
      where: and(
        eq(customerPrepaidCards.id, input.cardId),
        eq(customerPrepaidCards.organizationId, organizationId),
      ),
    });

    if (!card) {
      throw new Error("Không tìm thấy thẻ trả trước");
    }
    if (card.status !== "active") {
      throw new Error("Thẻ hiện không ở trạng thái hoạt động");
    }
    if (card.expiredAt && card.expiredAt.getTime() < Date.now()) {
      throw new Error("Thẻ đã hết hạn");
    }

    const amount = this.toPositive(input.amount, "Số tiền sử dụng");
    const remaining = Number(card.remainingBalance ?? 0);
    if (amount > remaining) {
      throw new Error("Số dư thẻ không đủ");
    }

    const nextBalance = Number((remaining - amount).toFixed(2));
    const now = new Date();

    const [updated] = await this.db
      .update(customerPrepaidCards)
      .set({
        remainingBalance: nextBalance,
        updatedAt: now,
      })
      .where(
        and(
          eq(customerPrepaidCards.id, card.id),
          eq(customerPrepaidCards.organizationId, organizationId),
        ),
      )
      .returning();

    const transaction = await this.createTransaction({
      organizationId,
      cardId: card.id,
      customerId: card.customerId,
      invoiceId: input.invoiceId ?? null,
      type: "consume",
      amount,
      balanceAfter: nextBalance,
      notes: input.notes?.trim() || null,
      metadata: null,
      createdByUserId: actorUserId,
      createdAt: now,
    });

    return {
      card: updated,
      transaction,
    };
  }

  async topupCard(
    organizationId: string,
    actorUserId: string,
    input: {
      cardId: number;
      amount: number;
      notes?: string;
    },
  ) {
    const card = await this.db.query.customerPrepaidCards.findFirst({
      where: and(
        eq(customerPrepaidCards.id, input.cardId),
        eq(customerPrepaidCards.organizationId, organizationId),
      ),
    });

    if (!card) {
      throw new Error("Không tìm thấy thẻ trả trước");
    }
    if (card.status !== "active") {
      throw new Error("Thẻ hiện không ở trạng thái hoạt động");
    }

    const amount = this.toPositive(input.amount, "Số tiền nạp");
    const nextBalance = Number((Number(card.remainingBalance ?? 0) + amount).toFixed(2));
    const now = new Date();

    const [updated] = await this.db
      .update(customerPrepaidCards)
      .set({
        remainingBalance: nextBalance,
        updatedAt: now,
      })
      .where(
        and(
          eq(customerPrepaidCards.id, card.id),
          eq(customerPrepaidCards.organizationId, organizationId),
        ),
      )
      .returning();

    const transaction = await this.createTransaction({
      organizationId,
      cardId: card.id,
      customerId: card.customerId,
      invoiceId: null,
      type: "topup",
      amount,
      balanceAfter: nextBalance,
      notes: input.notes?.trim() || null,
      metadata: null,
      createdByUserId: actorUserId,
      createdAt: now,
    });

    return {
      card: updated,
      transaction,
    };
  }
}
