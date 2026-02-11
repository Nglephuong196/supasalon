import { and, desc, eq, gte, lte } from "drizzle-orm";

import type { Database, NewCashSession, NewCashTransaction } from "../db";
import {
  cashSessions,
  cashTransactions,
  invoicePaymentTransactions,
} from "../db";

type CashPaymentMethod = "cash" | "card" | "transfer";

export type PaymentMethodReportItem = {
  method: CashPaymentMethod;
  received: number;
  refunded: number;
  net: number;
  pendingCount: number;
  confirmedCount: number;
};

export type CashSessionSnapshot = {
  sessionId: number;
  openingBalance: number;
  invoiceCashIn: number;
  invoiceCashOut: number;
  manualIn: number;
  manualOut: number;
  expectedClosingBalance: number;
};

export class CashManagementService {
  constructor(private db: Database) {}

  private toPositiveAmount(value: unknown, label: string) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`${label} không hợp lệ`);
    }
    return Number(amount.toFixed(2));
  }

  private toNonNegativeAmount(value: unknown, label: string) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`${label} không hợp lệ`);
    }
    return Number(amount.toFixed(2));
  }

  async getCurrentSession(organizationId: string) {
    return this.db.query.cashSessions.findFirst({
      where: and(eq(cashSessions.organizationId, organizationId), eq(cashSessions.status, "open")),
      with: {
        openedBy: true,
        closedBy: true,
      },
      orderBy: [desc(cashSessions.openedAt)],
    });
  }

  async listSessions(
    organizationId: string,
    filters?: {
      from?: Date;
      to?: Date;
      status?: "open" | "closed";
    },
  ) {
    const conditions = [eq(cashSessions.organizationId, organizationId)];

    if (filters?.status) {
      conditions.push(eq(cashSessions.status, filters.status));
    }
    if (filters?.from) {
      conditions.push(gte(cashSessions.openedAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(cashSessions.openedAt, filters.to));
    }

    return this.db.query.cashSessions.findMany({
      where: and(...conditions),
      with: {
        openedBy: true,
        closedBy: true,
      },
      orderBy: [desc(cashSessions.openedAt)],
      limit: 50,
    });
  }

  async openSession(
    organizationId: string,
    openedByUserId: string,
    input: { openingBalance: number; notes?: string | null },
  ) {
    const current = await this.getCurrentSession(organizationId);
    if (current) {
      throw new Error("Đang có ca quỹ mở. Vui lòng đóng ca hiện tại trước.");
    }

    const openingBalance = this.toNonNegativeAmount(input.openingBalance, "Số dư đầu ca");

    const payload: NewCashSession = {
      organizationId,
      openedByUserId,
      openingBalance,
      expectedClosingBalance: openingBalance,
      status: "open",
      notes: input.notes?.trim() || null,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await this.db.insert(cashSessions).values(payload).returning();
    return created;
  }

  private async buildSessionSnapshot(session: {
    id: number;
    openingBalance: number;
    organizationId: string;
  }): Promise<CashSessionSnapshot> {
    const paymentRows = await this.db.query.invoicePaymentTransactions.findMany({
      where: and(
        eq(invoicePaymentTransactions.organizationId, session.organizationId),
        eq(invoicePaymentTransactions.cashSessionId, session.id),
        eq(invoicePaymentTransactions.status, "confirmed"),
        eq(invoicePaymentTransactions.method, "cash"),
      ),
    });

    const manualRows = await this.db.query.cashTransactions.findMany({
      where: and(
        eq(cashTransactions.organizationId, session.organizationId),
        eq(cashTransactions.cashSessionId, session.id),
      ),
    });

    const invoiceCashIn = paymentRows
      .filter((row) => row.kind === "payment")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const invoiceCashOut = paymentRows
      .filter((row) => row.kind === "refund")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    const manualIn = manualRows
      .filter((row) => row.type === "in")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const manualOut = manualRows
      .filter((row) => row.type === "out")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    const expectedClosingBalance = Number(
      (
        Number(session.openingBalance ?? 0) +
        invoiceCashIn +
        manualIn -
        invoiceCashOut -
        manualOut
      ).toFixed(2),
    );

    return {
      sessionId: session.id,
      openingBalance: Number(session.openingBalance ?? 0),
      invoiceCashIn: Number(invoiceCashIn.toFixed(2)),
      invoiceCashOut: Number(invoiceCashOut.toFixed(2)),
      manualIn: Number(manualIn.toFixed(2)),
      manualOut: Number(manualOut.toFixed(2)),
      expectedClosingBalance,
    };
  }

  async getCurrentSessionSnapshot(organizationId: string) {
    const current = await this.getCurrentSession(organizationId);
    if (!current) return null;
    return this.buildSessionSnapshot(current);
  }

  async closeSession(
    organizationId: string,
    sessionId: number,
    closedByUserId: string,
    input: { actualClosingBalance: number; notes?: string | null },
  ) {
    const session = await this.db.query.cashSessions.findFirst({
      where: and(
        eq(cashSessions.id, sessionId),
        eq(cashSessions.organizationId, organizationId),
      ),
    });

    if (!session) {
      throw new Error("Không tìm thấy ca quỹ");
    }
    if (session.status !== "open") {
      throw new Error("Ca quỹ này đã được đóng");
    }

    const snapshot = await this.buildSessionSnapshot(session);
    const actualClosingBalance = this.toNonNegativeAmount(input.actualClosingBalance, "Tiền thực tế");
    const discrepancy = Number((actualClosingBalance - snapshot.expectedClosingBalance).toFixed(2));

    const [closed] = await this.db
      .update(cashSessions)
      .set({
        status: "closed",
        expectedClosingBalance: snapshot.expectedClosingBalance,
        actualClosingBalance,
        discrepancy,
        closedByUserId,
        closedAt: new Date(),
        updatedAt: new Date(),
        notes: input.notes?.trim() || session.notes,
      })
      .where(and(eq(cashSessions.id, session.id), eq(cashSessions.organizationId, organizationId)))
      .returning();

    return {
      session: closed,
      snapshot,
      discrepancy,
    };
  }

  async listCashTransactions(
    organizationId: string,
    filters?: {
      cashSessionId?: number;
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(cashTransactions.organizationId, organizationId)];

    if (filters?.cashSessionId) {
      conditions.push(eq(cashTransactions.cashSessionId, filters.cashSessionId));
    }
    if (filters?.from) {
      conditions.push(gte(cashTransactions.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(cashTransactions.createdAt, filters.to));
    }

    return this.db.query.cashTransactions.findMany({
      where: and(...conditions),
      with: {
        cashSession: true,
        createdBy: true,
      },
      orderBy: [desc(cashTransactions.createdAt)],
      limit: 200,
    });
  }

  async createCashTransaction(
    organizationId: string,
    createdByUserId: string,
    input: {
      type: "in" | "out";
      amount: number;
      category?: string;
      notes?: string;
      cashSessionId?: number;
    },
  ) {
    const amount = this.toPositiveAmount(input.amount, "Số tiền thu/chi");

    let cashSessionId = input.cashSessionId;
    if (!cashSessionId) {
      const current = await this.getCurrentSession(organizationId);
      cashSessionId = current?.id;
    }

    if (!cashSessionId) {
      throw new Error("Chưa mở ca quỹ. Vui lòng mở ca trước khi ghi thu/chi.");
    }

    const session = await this.db.query.cashSessions.findFirst({
      where: and(
        eq(cashSessions.id, cashSessionId),
        eq(cashSessions.organizationId, organizationId),
      ),
    });

    if (!session) {
      throw new Error("Ca quỹ không tồn tại");
    }
    if (session.status !== "open") {
      throw new Error("Ca quỹ đã đóng, không thể thêm giao dịch");
    }

    const payload: NewCashTransaction = {
      organizationId,
      cashSessionId,
      createdByUserId,
      type: input.type,
      amount,
      category: input.category?.trim() || "other",
      notes: input.notes?.trim() || null,
      createdAt: new Date(),
    };

    const [created] = await this.db.insert(cashTransactions).values(payload).returning();
    return created;
  }

  async getPaymentMethodReport(
    organizationId: string,
    from?: Date,
    to?: Date,
  ): Promise<PaymentMethodReportItem[]> {
    const confirmedConditions = [
      eq(invoicePaymentTransactions.organizationId, organizationId),
      eq(invoicePaymentTransactions.status, "confirmed"),
    ];

    const pendingConditions = [
      eq(invoicePaymentTransactions.organizationId, organizationId),
      eq(invoicePaymentTransactions.kind, "payment"),
      eq(invoicePaymentTransactions.status, "pending"),
    ];

    if (from) {
      confirmedConditions.push(gte(invoicePaymentTransactions.createdAt, from));
      pendingConditions.push(gte(invoicePaymentTransactions.createdAt, from));
    }
    if (to) {
      confirmedConditions.push(lte(invoicePaymentTransactions.createdAt, to));
      pendingConditions.push(lte(invoicePaymentTransactions.createdAt, to));
    }

    const [confirmedRows, pendingRows] = await Promise.all([
      this.db.query.invoicePaymentTransactions.findMany({
        where: and(...confirmedConditions),
      }),
      this.db.query.invoicePaymentTransactions.findMany({
        where: and(...pendingConditions),
      }),
    ]);

    const base: Record<CashPaymentMethod, PaymentMethodReportItem> = {
      cash: {
        method: "cash",
        received: 0,
        refunded: 0,
        net: 0,
        pendingCount: 0,
        confirmedCount: 0,
      },
      card: {
        method: "card",
        received: 0,
        refunded: 0,
        net: 0,
        pendingCount: 0,
        confirmedCount: 0,
      },
      transfer: {
        method: "transfer",
        received: 0,
        refunded: 0,
        net: 0,
        pendingCount: 0,
        confirmedCount: 0,
      },
    };

    for (const row of confirmedRows) {
      const method = row.method as CashPaymentMethod;
      if (!base[method]) continue;
      const amount = Number(row.amount ?? 0);
      if (row.kind === "refund") {
        base[method].refunded += amount;
      } else {
        base[method].received += amount;
      }
      base[method].confirmedCount += 1;
    }

    for (const row of pendingRows) {
      const method = row.method as CashPaymentMethod;
      if (!base[method]) continue;
      base[method].pendingCount += 1;
    }

    return (Object.keys(base) as CashPaymentMethod[]).map((method) => {
      const item = base[method];
      return {
        ...item,
        received: Number(item.received.toFixed(2)),
        refunded: Number(item.refunded.toFixed(2)),
        net: Number((item.received - item.refunded).toFixed(2)),
      };
    });
  }

  async getOverview(organizationId: string, from?: Date, to?: Date) {
    const [currentSession, currentSnapshot, paymentReport, pendingPayments] = await Promise.all([
      this.getCurrentSession(organizationId),
      this.getCurrentSessionSnapshot(organizationId),
      this.getPaymentMethodReport(organizationId, from, to),
      this.db.query.invoicePaymentTransactions.findMany({
        where: and(
          eq(invoicePaymentTransactions.organizationId, organizationId),
          eq(invoicePaymentTransactions.kind, "payment"),
          eq(invoicePaymentTransactions.status, "pending"),
        ),
      }),
    ]);

    return {
      currentSession,
      currentSnapshot,
      paymentReport,
      pendingPaymentsCount: pendingPayments.length,
    };
  }
}
