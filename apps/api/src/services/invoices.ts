import { eq, and, desc, gte, lte } from "drizzle-orm";
import type { Database } from "../db";
import {
  invoices,
  invoiceItems,
  invoiceItemStaff,
  bookings,
  customers,
  type NewInvoice,
  type NewInvoiceItem,
  type NewInvoiceItemStaff,
} from "../db/schema";

export type CreateInvoiceRequest = NewInvoice & {
  items?: (NewInvoiceItem & {
    staff: NewInvoiceItemStaff[];
  })[];
};

export class InvoicesService {
  constructor(private db: Database) {}

  async findAll(
    organizationId: string,
    filters?: { isOpenInTab?: boolean; from?: Date; to?: Date },
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

    return this.db.query.invoices.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        booking: true,
        items: {
          with: {
            staffCommissions: {
              with: {
                staff: true, // Include staff details
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
        customer: true,
        booking: true,
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
        customer: true,
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

    // Explicitly construct insert data to avoid any weirdness with partial spread
    const insertData: any = {
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
      createdAt:
        cleanInvoiceData.createdAt instanceof Date
          ? cleanInvoiceData.createdAt
          : cleanInvoiceData.createdAt
            ? new Date(cleanInvoiceData.createdAt)
            : new Date(),
      paidAt: cleanInvoiceData.paidAt ? new Date(cleanInvoiceData.paidAt) : null,
      isOpenInTab: cleanInvoiceData.isOpenInTab ?? true,
      deletedAt: cleanInvoiceData.deletedAt ? new Date(cleanInvoiceData.deletedAt) : null,
    };

    // Filter undefined values
    Object.keys(insertData).forEach(
      (key) => insertData[key] === undefined && delete insertData[key],
    );

    // D1/SQLite handles NULL in AUTOINCREMENT columns by using the next sequence value.
    // Drizzle's insert should now work since the 'deleted_at' column exists in the DB.
    const [newInvoice] = await this.db.insert(invoices).values(insertData).returning();

    // Handle items and commissions
    if (items && items.length > 0) {
      for (const item of items) {
        const { staff, ...rest } = item;

        // Explicitly map only the fields the DB expects
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

        // Create Invoice Item
        const [newItem] = await this.db.insert(invoiceItems).values(itemData).returning();

        // Create Staff Commissions
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
    // Handling completion logic
    // If status is becoming 'paid', set paidAt and close tab
    const updates: Partial<NewInvoice> = { ...data };

    // Convert date strings to Date objects
    if (updates.createdAt && typeof updates.createdAt === "string") {
      updates.createdAt = new Date(updates.createdAt);
    }
    if (updates.paidAt && typeof updates.paidAt === "string") {
      updates.paidAt = new Date(updates.paidAt);
    }
    if (updates.deletedAt && typeof updates.deletedAt === "string") {
      updates.deletedAt = new Date(updates.deletedAt);
    }

    // Explicit completion logic
    if (data.status === "paid") {
      updates.paidAt = new Date();
      updates.isOpenInTab = false; // Close tab on complete
    }

    // Keep isOpenInTab logic if explicitly passed (e.g. closing tab without completing)
    if (data.isOpenInTab !== undefined) {
      updates.isOpenInTab = data.isOpenInTab;
    }

    const { items, ...invoiceFields } = updates as CreateInvoiceRequest;

    const [updated] = await this.db
      .update(invoices)
      .set(invoiceFields)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    // Handle items update if provided
    if (items) {
      // 1. Delete existing items (and cascade deletes staff commissions)
      await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // 2. Insert new items
      if (items.length > 0) {
        for (const item of items) {
          const { staff, ...rest } = item;

          // Explicitly map only the fields the DB expects
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

          // Create Invoice Item
          const [newItem] = await this.db.insert(invoiceItems).values(itemData).returning();

          // Create Staff Commissions
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

  async delete(id: number, organizationId: string) {
    // Soft delete: status -> cancelled, deletedAt -> now, close tab
    // Instead of deleting the record, we mark it.
    const [cancelled] = await this.db
      .update(invoices)
      .set({
        status: "cancelled",
        deletedAt: new Date(),
        isOpenInTab: false,
      })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    // Optionally we can still return it as if it was "deleted" or just the cancelled record
    return cancelled;
  }
}
