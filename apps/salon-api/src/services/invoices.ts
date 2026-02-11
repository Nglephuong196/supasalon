import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Database } from "../db";
import {
  type NewInvoice,
  type NewInvoiceItem,
  type NewInvoiceItemStaff,
  type NewInvoicePaymentTransaction,
  bookings,
  branches,
  cashSessions,
  invoiceItemStaff,
  invoiceItems,
  invoicePaymentTransactions,
  invoices,
} from "../db/schema";

export type InvoicePaymentMethod = "cash" | "card" | "transfer";
export type InvoicePaymentStatus = "pending" | "confirmed" | "failed" | "cancelled";

export type InvoicePaymentInput = {
  method: InvoicePaymentMethod;
  amount: number;
  status?: InvoicePaymentStatus;
  referenceCode?: string | null;
  notes?: string | null;
};

export type CreateInvoiceRequest = NewInvoice & {
  items?: (NewInvoiceItem & {
    staff: NewInvoiceItemStaff[];
  })[];
};

export class InvoicesService {
  constructor(private db: Database) {}

  private async resolveBranchId(
    organizationId: string,
    branchId?: number | null,
    bookingId?: number | null,
  ) {
    if (branchId) {
      const found = await this.db.query.branches.findFirst({
        where: and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)),
      });
      if (!found) {
        throw new Error("Chi nhánh không hợp lệ");
      }
      return found.id;
    }

    if (bookingId) {
      const linkedBooking = await this.db.query.bookings.findFirst({
        where: and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)),
      });
      if (linkedBooking?.branchId) return linkedBooking.branchId;
    }

    const defaultBranch = await this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.isDefault, true)),
    });
    return defaultBranch?.id ?? null;
  }

  private toAmount(value: unknown): number {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Số tiền không hợp lệ");
    }
    return Number(amount.toFixed(2));
  }

  private resolvePaymentMethod(rows: Array<{ method: string; amount: number }>):
    | "cash"
    | "card"
    | "transfer"
    | "mixed"
    | null {
    const positiveMethods = new Set<string>();
    for (const row of rows) {
      if (Number(row.amount) > 0) {
        positiveMethods.add(row.method);
      }
    }
    if (positiveMethods.size === 0) return null;
    if (positiveMethods.size === 1) {
      const only = Array.from(positiveMethods)[0];
      if (only === "cash" || only === "card" || only === "transfer") return only;
      return "mixed";
    }
    return "mixed";
  }

  private async getOpenCashSessionId(organizationId: string) {
    const openSession = await this.db.query.cashSessions.findFirst({
      where: and(
        eq(cashSessions.organizationId, organizationId),
        eq(cashSessions.status, "open"),
      ),
      orderBy: [desc(cashSessions.openedAt)],
    });
    return openSession?.id ?? null;
  }

  private async getConfirmedRows(invoiceId: number, organizationId: string) {
    return this.db.query.invoicePaymentTransactions.findMany({
      where: and(
        eq(invoicePaymentTransactions.invoiceId, invoiceId),
        eq(invoicePaymentTransactions.organizationId, organizationId),
        eq(invoicePaymentTransactions.status, "confirmed"),
      ),
      orderBy: [desc(invoicePaymentTransactions.createdAt)],
    });
  }

  private calcNetPaid(rows: Array<{ kind: string; amount: number | null }>) {
    return rows.reduce((sum, row) => {
      const amount = Number(row.amount ?? 0);
      if (row.kind === "refund") return sum - amount;
      return sum + amount;
    }, 0);
  }

  private async refreshInvoicePaymentState(invoiceId: number, organizationId: string) {
    const invoice = await this.db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)),
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "cancelled") {
      return invoice;
    }

    const confirmedRows = await this.getConfirmedRows(invoiceId, organizationId);
    const netPaidRaw = this.calcNetPaid(confirmedRows);
    const netPaid = Number(Math.max(0, netPaidRaw).toFixed(2));

    const methodNet = new Map<string, number>();
    for (const row of confirmedRows) {
      const current = methodNet.get(row.method) ?? 0;
      const amount = Number(row.amount ?? 0);
      methodNet.set(row.method, row.kind === "refund" ? current - amount : current + amount);
    }

    const paymentMethod = this.resolvePaymentMethod(
      Array.from(methodNet.entries()).map(([method, amount]) => ({ method, amount })),
    );

    const hasRefund = confirmedRows.some((row) => row.kind === "refund");
    const total = Number(invoice.total ?? 0);
    const isFullyPaid = netPaid >= total - 0.01;

    let status: "pending" | "paid" | "refunded" = "pending";
    if (hasRefund && netPaid <= 0.01) {
      status = "refunded";
    } else if (hasRefund && netPaid > 0.01) {
      status = "paid";
    } else if (isFullyPaid) {
      status = "paid";
    }

    const [updated] = await this.db
      .update(invoices)
      .set({
        amountPaid: netPaid,
        change: status === "paid" ? Number(Math.max(0, netPaid - total).toFixed(2)) : 0,
        paymentMethod,
        status,
        paidAt: status === "paid" ? invoice.paidAt ?? new Date() : null,
        refundedAt: status === "refunded" ? invoice.refundedAt ?? new Date() : null,
        isOpenInTab: status === "pending",
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async findAll(
    organizationId: string,
    filters?: { isOpenInTab?: boolean; from?: Date; to?: Date; branchId?: number },
  ) {
    const conditions = [eq(invoices.organizationId, organizationId)];

    if (filters?.isOpenInTab !== undefined) {
      conditions.push(eq(invoices.isOpenInTab, filters.isOpenInTab));
    }

    if (filters?.from) {
      conditions.push(gte(invoices.createdAt, filters.from));
    }

    if (filters?.to) {
      conditions.push(lte(invoices.createdAt, filters.to));
    }
    if (filters?.branchId) {
      conditions.push(eq(invoices.branchId, filters.branchId));
    }

    return this.db.query.invoices.findMany({
      where: and(...conditions),
      with: {
        branch: true,
        customer: true,
        booking: true,
        payments: {
          with: {
            cashSession: true,
            createdBy: true,
          },
          orderBy: [desc(invoicePaymentTransactions.createdAt)],
        },
        items: {
          with: {
            staffCommissions: {
              with: {
                staff: true,
              },
            },
          },
        },
      },
      orderBy: [desc(invoices.createdAt)],
    });
  }

  async findById(id: number, organizationId: string) {
    return this.db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
      with: {
        branch: true,
        customer: true,
        booking: true,
        payments: {
          with: {
            cashSession: true,
            createdBy: true,
          },
          orderBy: [desc(invoicePaymentTransactions.createdAt)],
        },
        items: {
          with: {
            staffCommissions: {
              with: {
                staff: true,
              },
            },
          },
        },
      },
    });
  }

  async findByBookingId(bookingId: number, organizationId: string) {
    return this.db.query.invoices.findFirst({
      where: and(eq(invoices.bookingId, bookingId), eq(invoices.organizationId, organizationId)),
      with: {
        branch: true,
        customer: true,
        payments: {
          with: {
            cashSession: true,
            createdBy: true,
          },
          orderBy: [desc(invoicePaymentTransactions.createdAt)],
        },
        items: {
          with: {
            staffCommissions: {
              with: {
                staff: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: CreateInvoiceRequest, organizationId: string) {
    const { items, id, ...cleanInvoiceData } = data;
    const resolvedBranchId = await this.resolveBranchId(
      organizationId,
      cleanInvoiceData.branchId,
      cleanInvoiceData.bookingId,
    );

    const insertData: NewInvoice = {
      organizationId,
      subtotal: cleanInvoiceData.subtotal || 0,
      discountValue: cleanInvoiceData.discountValue || 0,
      discountType: cleanInvoiceData.discountType || "percent",
      total: cleanInvoiceData.total || 0,
      amountPaid: cleanInvoiceData.amountPaid || 0,
      change: cleanInvoiceData.change || 0,
      status: cleanInvoiceData.status || "pending",
      paymentMethod: cleanInvoiceData.paymentMethod,
      notes: cleanInvoiceData.notes,
      customerId: cleanInvoiceData.customerId,
      bookingId: cleanInvoiceData.bookingId,
      branchId: resolvedBranchId,
      createdAt:
        cleanInvoiceData.createdAt instanceof Date
          ? cleanInvoiceData.createdAt
          : cleanInvoiceData.createdAt
            ? new Date(cleanInvoiceData.createdAt)
            : new Date(),
      paidAt: cleanInvoiceData.paidAt ? new Date(cleanInvoiceData.paidAt) : null,
      isOpenInTab: cleanInvoiceData.isOpenInTab ?? true,
      deletedAt: cleanInvoiceData.deletedAt ? new Date(cleanInvoiceData.deletedAt) : null,
      cancelReason: cleanInvoiceData.cancelReason,
      cancelledAt: cleanInvoiceData.cancelledAt
        ? new Date(cleanInvoiceData.cancelledAt)
        : null,
      refundReason: cleanInvoiceData.refundReason,
      refundedAt: cleanInvoiceData.refundedAt
        ? new Date(cleanInvoiceData.refundedAt)
        : null,
    };

    Object.keys(insertData).forEach(
      (key) =>
        (insertData as Record<string, unknown>)[key] === undefined &&
        delete (insertData as Record<string, unknown>)[key],
    );

    const [newInvoice] = await this.db.insert(invoices).values(insertData).returning();

    if (items && items.length > 0) {
      for (const item of items) {
        const { staff } = item;

        const itemData = {
          invoiceId: newInvoice.id,
          type: item.type,
          referenceId: item.referenceId || null,
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discountValue: Number(item.discountValue) || 0,
          discountType: item.discountType || "percent",
          total: Number(item.total) || 0,
        };

        const [newItem] = await this.db.insert(invoiceItems).values(itemData).returning();

        if (staff && staff.length > 0) {
          const staffData = staff.map((s: any) => ({
            invoiceItemId: newItem.id,
            staffId: s.staffId,
            role: s.role || "technician",
            commissionValue: Number(s.commissionValue) || 0,
            commissionType: s.commissionType || "percent",
            bonus: Number(s.bonus) || 0,
          }));
          await this.db.insert(invoiceItemStaff).values(staffData);
        }
      }
    }

    return newInvoice;
  }

  async update(id: number, organizationId: string, data: Partial<CreateInvoiceRequest>) {
    const updates: Partial<NewInvoice> = { ...data };

    if (updates.createdAt && typeof updates.createdAt === "string") {
      updates.createdAt = new Date(updates.createdAt);
    }
    if (updates.paidAt && typeof updates.paidAt === "string") {
      updates.paidAt = new Date(updates.paidAt);
    }
    if (updates.deletedAt && typeof updates.deletedAt === "string") {
      updates.deletedAt = new Date(updates.deletedAt);
    }
    if (typeof updates.branchId === "number" && updates.branchId > 0) {
      await this.resolveBranchId(organizationId, updates.branchId, null);
    }

    if (data.status === "paid") {
      updates.paidAt = new Date();
      updates.isOpenInTab = false;
    }
    if (data.status === "cancelled") {
      updates.cancelledAt = new Date();
      updates.isOpenInTab = false;
      updates.deletedAt = new Date();
    }
    if (data.status === "refunded") {
      updates.refundedAt = new Date();
      updates.isOpenInTab = false;
    }

    if (data.isOpenInTab !== undefined) {
      updates.isOpenInTab = data.isOpenInTab;
    }

    const { items, ...invoiceFields } = updates as CreateInvoiceRequest;

    const [updated] = await this.db
      .update(invoices)
      .set(invoiceFields)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    if (items) {
      await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      if (items.length > 0) {
        for (const item of items) {
          const { staff } = item;

          const itemData = {
            invoiceId: id,
            type: item.type,
            referenceId: item.referenceId || null,
            name: item.name,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            discountValue: Number(item.discountValue) || 0,
            discountType: item.discountType || "percent",
            total: Number(item.total) || 0,
          };

          const [newItem] = await this.db.insert(invoiceItems).values(itemData).returning();

          if (staff && staff.length > 0) {
            const staffData = staff.map((s: any) => ({
              invoiceItemId: newItem.id,
              staffId: s.staffId,
              role: s.role || "technician",
              commissionValue: Number(s.commissionValue) || 0,
              commissionType: s.commissionType || "percent",
              bonus: Number(s.bonus) || 0,
            }));
            await this.db.insert(invoiceItemStaff).values(staffData);
          }
        }
      }
    }

    return updated;
  }

  async listPayments(invoiceId: number, organizationId: string) {
    return this.db.query.invoicePaymentTransactions.findMany({
      where: and(
        eq(invoicePaymentTransactions.organizationId, organizationId),
        eq(invoicePaymentTransactions.invoiceId, invoiceId),
      ),
      with: {
        invoice: {
          with: {
            customer: true,
          },
        },
        cashSession: true,
        createdBy: true,
      },
      orderBy: [desc(invoicePaymentTransactions.createdAt)],
    });
  }

  async listPendingPayments(organizationId: string, filters?: { from?: Date; to?: Date }) {
    const conditions = [
      eq(invoicePaymentTransactions.organizationId, organizationId),
      eq(invoicePaymentTransactions.kind, "payment"),
      eq(invoicePaymentTransactions.status, "pending"),
    ];

    if (filters?.from) {
      conditions.push(gte(invoicePaymentTransactions.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(invoicePaymentTransactions.createdAt, filters.to));
    }

    return this.db.query.invoicePaymentTransactions.findMany({
      where: and(...conditions),
      with: {
        invoice: {
          with: {
            customer: true,
          },
        },
        createdBy: true,
      },
      orderBy: [desc(invoicePaymentTransactions.createdAt)],
    });
  }

  async settle(
    invoiceId: number,
    organizationId: string,
    actorUserId: string,
    input: { payments: InvoicePaymentInput[]; notes?: string | null },
  ) {
    const invoice = await this.findById(invoiceId, organizationId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status === "cancelled") {
      throw new Error("Không thể thanh toán hóa đơn đã hủy");
    }

    const payments = (input.payments || [])
      .map((payment) => ({
        method: payment.method,
        amount: this.toAmount(payment.amount),
        status: payment.method === "cash" ? "confirmed" : payment.status ?? "confirmed",
        referenceCode: payment.referenceCode?.trim() || null,
        notes: payment.notes?.trim() || null,
      }))
      .filter((payment) => payment.amount > 0);

    if (payments.length === 0) {
      throw new Error("Vui lòng nhập ít nhất một khoản thanh toán");
    }

    const openCashSessionId = await this.getOpenCashSessionId(organizationId);

    const values: NewInvoicePaymentTransaction[] = payments.map((payment) => ({
      organizationId,
      invoiceId,
      kind: "payment",
      method: payment.method,
      status: payment.status,
      amount: payment.amount,
      referenceCode: payment.referenceCode,
      notes: payment.notes,
      createdByUserId: actorUserId,
      cashSessionId:
        payment.method === "cash" && payment.status === "confirmed" ? openCashSessionId : null,
      confirmedAt: payment.status === "confirmed" ? new Date() : null,
      createdAt: new Date(),
    }));

    await this.db.insert(invoicePaymentTransactions).values(values);

    if (input.notes && input.notes.trim()) {
      await this.db
        .update(invoices)
        .set({
          notes: input.notes.trim(),
        })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)));
    }

    await this.refreshInvoicePaymentState(invoiceId, organizationId);

    const refreshed = await this.findById(invoiceId, organizationId);
    if (!refreshed) {
      throw new Error("Invoice not found");
    }
    return refreshed;
  }

  async updatePaymentStatus(
    paymentId: number,
    organizationId: string,
    status: InvoicePaymentStatus,
    note?: string | null,
  ) {
    const payment = await this.db.query.invoicePaymentTransactions.findFirst({
      where: and(
        eq(invoicePaymentTransactions.id, paymentId),
        eq(invoicePaymentTransactions.organizationId, organizationId),
      ),
    });

    if (!payment) {
      throw new Error("Không tìm thấy giao dịch thanh toán");
    }

    const openCashSessionId =
      payment.method === "cash" && status === "confirmed"
        ? await this.getOpenCashSessionId(organizationId)
        : payment.cashSessionId;

    const [updated] = await this.db
      .update(invoicePaymentTransactions)
      .set({
        status,
        notes: note?.trim() || payment.notes,
        cashSessionId: openCashSessionId,
        confirmedAt: status === "confirmed" ? payment.confirmedAt ?? new Date() : null,
      })
      .where(
        and(
          eq(invoicePaymentTransactions.id, paymentId),
          eq(invoicePaymentTransactions.organizationId, organizationId),
        ),
      )
      .returning();

    await this.refreshInvoicePaymentState(payment.invoiceId, organizationId);

    return updated;
  }

  async cancel(id: number, organizationId: string, reason?: string | null) {
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const confirmedRows = await this.getConfirmedRows(id, organizationId);
    const netPaid = this.calcNetPaid(confirmedRows);
    if (netPaid > 0.01) {
      throw new Error("Hóa đơn đã có tiền thanh toán. Vui lòng hoàn tiền thay vì hủy.");
    }

    const [cancelled] = await this.db
      .update(invoices)
      .set({
        status: "cancelled",
        cancelReason: reason?.trim() || null,
        cancelledAt: new Date(),
        deletedAt: new Date(),
        isOpenInTab: false,
      })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    return cancelled;
  }

  async refund(
    id: number,
    organizationId: string,
    reason?: string | null,
    options?: {
      amount?: number;
      allocations?: InvoicePaymentInput[];
    },
  ) {
    const invoice = await this.findById(id, organizationId);
    if (!invoice) return undefined;
    if (invoice.status === "cancelled") {
      throw new Error("Không thể hoàn tiền hóa đơn đã hủy");
    }

    const confirmedRows = await this.getConfirmedRows(id, organizationId);
    const netPaid = this.calcNetPaid(confirmedRows);
    if (netPaid <= 0.01) {
      throw new Error("Hóa đơn chưa có khoản đã thu để hoàn tiền");
    }

    const refundableByMethod = new Map<InvoicePaymentMethod, number>([
      ["cash", 0],
      ["card", 0],
      ["transfer", 0],
    ]);

    for (const row of confirmedRows) {
      const method = row.method as InvoicePaymentMethod;
      if (!refundableByMethod.has(method)) continue;
      const current = refundableByMethod.get(method) ?? 0;
      const amount = Number(row.amount ?? 0);
      refundableByMethod.set(method, row.kind === "refund" ? current - amount : current + amount);
    }

    const refundableTotal = Array.from(refundableByMethod.values()).reduce(
      (sum, amount) => sum + Math.max(0, amount),
      0,
    );
    if (refundableTotal <= 0.01) {
      throw new Error("Không còn số dư để hoàn tiền");
    }

    let refundAmount = options?.amount ? this.toAmount(options.amount) : Number(invoice.total || 0);
    if (refundAmount <= 0) {
      refundAmount = Number(netPaid.toFixed(2));
    }
    if (refundAmount > refundableTotal + 0.01) {
      throw new Error("Số tiền hoàn vượt quá số dư đã thanh toán");
    }

    let allocations: Array<{
      method: InvoicePaymentMethod;
      amount: number;
      status: InvoicePaymentStatus;
      referenceCode?: string | null;
      notes?: string | null;
    }> = [];

    if (options?.allocations?.length) {
      allocations = options.allocations
        .map((item) => ({
          method: item.method,
          amount: this.toAmount(item.amount),
          status: item.method === "cash" ? "confirmed" : item.status ?? "confirmed",
          referenceCode: item.referenceCode?.trim() || null,
          notes: item.notes?.trim() || null,
        }))
        .filter((item) => item.amount > 0);

      const allocated = allocations.reduce((sum, item) => sum + item.amount, 0);
      if (Math.abs(allocated - refundAmount) > 0.01) {
        throw new Error("Tổng phân bổ hoàn tiền phải khớp số tiền hoàn");
      }
    } else {
      let remaining = refundAmount;
      const sortedMethods = Array.from(refundableByMethod.entries()).sort((a, b) => b[1] - a[1]);
      for (const [method, available] of sortedMethods) {
        if (remaining <= 0.01) break;
        const safeAvailable = Math.max(0, Number(available.toFixed(2)));
        if (safeAvailable <= 0) continue;
        const amount = Number(Math.min(remaining, safeAvailable).toFixed(2));
        if (amount <= 0) continue;
        allocations.push({
          method,
          amount,
          status: "confirmed",
        });
        remaining = Number((remaining - amount).toFixed(2));
      }

      if (remaining > 0.01) {
        throw new Error("Không thể tự động phân bổ hoàn tiền theo phương thức gốc");
      }
    }

    const openCashSessionId = await this.getOpenCashSessionId(organizationId);

    await this.db.insert(invoicePaymentTransactions).values(
      allocations.map((item) => ({
        organizationId,
        invoiceId: id,
        kind: "refund" as const,
        method: item.method,
        status: item.status,
        amount: item.amount,
        referenceCode: item.referenceCode,
        notes: item.notes,
        cashSessionId:
          item.method === "cash" && item.status === "confirmed" ? openCashSessionId : null,
        confirmedAt: item.status === "confirmed" ? new Date() : null,
        createdAt: new Date(),
      })),
    );

    const refreshed = await this.refreshInvoicePaymentState(id, organizationId);

    const [updated] = await this.db
      .update(invoices)
      .set({
        refundReason: reason?.trim() || null,
        refundedAt: refreshed.status === "refunded" ? refreshed.refundedAt ?? new Date() : null,
      })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async delete(id: number, organizationId: string) {
    return this.cancel(id, organizationId, null);
  }
}
