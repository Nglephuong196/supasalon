import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";

import type {
  ApprovalRequest,
  ApprovalPolicy,
  Database,
  NewApprovalPolicy,
  NewApprovalRequest,
} from "../db";
import { approvalPolicies, approvalRequests } from "../db";

export type ApprovalEntityType =
  | "invoice"
  | "cash_transaction"
  | "booking"
  | "commission_payout"
  | "prepaid_card";

export type ApprovalRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ApprovalPolicyInput = {
  requireInvoiceCancelApproval?: boolean;
  requireInvoiceRefundApproval?: boolean;
  invoiceRefundThreshold?: number;
  requireCashOutApproval?: boolean;
  cashOutThreshold?: number;
};

export class ApprovalsService {
  constructor(private db: Database) {}

  private toNumber(value: unknown, fallback = 0) {
    const amount = Number(value ?? fallback);
    if (!Number.isFinite(amount)) return fallback;
    return Number(amount.toFixed(2));
  }

  private defaultPolicy(organizationId: string): ApprovalPolicy {
    const now = new Date();
    return {
      id: 0,
      organizationId,
      requireInvoiceCancelApproval: false,
      requireInvoiceRefundApproval: false,
      invoiceRefundThreshold: 0,
      requireCashOutApproval: false,
      cashOutThreshold: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPolicy(organizationId: string) {
    const policy = await this.db.query.approvalPolicies.findFirst({
      where: eq(approvalPolicies.organizationId, organizationId),
    });
    if (policy) return policy;
    return this.defaultPolicy(organizationId);
  }

  async upsertPolicy(organizationId: string, input: ApprovalPolicyInput) {
    const existing = await this.db.query.approvalPolicies.findFirst({
      where: eq(approvalPolicies.organizationId, organizationId),
    });

    const updates: Partial<NewApprovalPolicy> = {
      requireInvoiceCancelApproval:
        typeof input.requireInvoiceCancelApproval === "boolean"
          ? input.requireInvoiceCancelApproval
          : undefined,
      requireInvoiceRefundApproval:
        typeof input.requireInvoiceRefundApproval === "boolean"
          ? input.requireInvoiceRefundApproval
          : undefined,
      invoiceRefundThreshold:
        input.invoiceRefundThreshold !== undefined
          ? Math.max(0, this.toNumber(input.invoiceRefundThreshold))
          : undefined,
      requireCashOutApproval:
        typeof input.requireCashOutApproval === "boolean" ? input.requireCashOutApproval : undefined,
      cashOutThreshold:
        input.cashOutThreshold !== undefined
          ? Math.max(0, this.toNumber(input.cashOutThreshold))
          : undefined,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(approvalPolicies)
        .set(updates)
        .where(eq(approvalPolicies.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(approvalPolicies)
      .values({
        organizationId,
        requireInvoiceCancelApproval: updates.requireInvoiceCancelApproval ?? false,
        requireInvoiceRefundApproval: updates.requireInvoiceRefundApproval ?? false,
        invoiceRefundThreshold: updates.invoiceRefundThreshold ?? 0,
        requireCashOutApproval: updates.requireCashOutApproval ?? false,
        cashOutThreshold: updates.cashOutThreshold ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  }

  async listRequests(
    organizationId: string,
    filters?: {
      status?: ApprovalRequestStatus;
      entityType?: ApprovalEntityType;
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(approvalRequests.organizationId, organizationId)];

    if (filters?.status) {
      conditions.push(eq(approvalRequests.status, filters.status));
    }
    if (filters?.entityType) {
      conditions.push(eq(approvalRequests.entityType, filters.entityType));
    }
    if (filters?.from) {
      conditions.push(gte(approvalRequests.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(approvalRequests.createdAt, filters.to));
    }

    return this.db.query.approvalRequests.findMany({
      where: and(...conditions),
      with: {
        requestedBy: true,
        reviewedBy: true,
      },
      orderBy: [desc(approvalRequests.createdAt)],
      limit: 200,
    });
  }

  async findRequestById(id: number, organizationId: string) {
    return this.db.query.approvalRequests.findFirst({
      where: and(eq(approvalRequests.id, id), eq(approvalRequests.organizationId, organizationId)),
      with: {
        requestedBy: true,
        reviewedBy: true,
      },
    });
  }

  async createRequest(
    organizationId: string,
    input: {
      entityType: ApprovalEntityType;
      entityId?: number | null;
      action: string;
      payload?: Record<string, unknown> | null;
      requestReason?: string | null;
      requestedByUserId?: string | null;
      expiresAt?: Date | null;
    },
  ) {
    const duplicateConditions = [
      eq(approvalRequests.organizationId, organizationId),
      eq(approvalRequests.status, "pending"),
      eq(approvalRequests.entityType, input.entityType),
      eq(approvalRequests.action, input.action),
    ];
    if (input.entityId === null || typeof input.entityId === "undefined") {
      duplicateConditions.push(isNull(approvalRequests.entityId));
    } else {
      duplicateConditions.push(eq(approvalRequests.entityId, input.entityId));
    }

    const duplicated = await this.db.query.approvalRequests.findFirst({
      where: and(...duplicateConditions),
      orderBy: [desc(approvalRequests.createdAt)],
    });

    if (duplicated) {
      return duplicated;
    }

    const values: NewApprovalRequest = {
      organizationId,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      payload: input.payload ?? null,
      status: "pending",
      requestReason: input.requestReason?.trim() || null,
      reviewReason: null,
      requestedByUserId: input.requestedByUserId ?? null,
      reviewedByUserId: null,
      reviewedAt: null,
      expiresAt: input.expiresAt ?? null,
      executedAt: null,
      executionResult: null,
      createdAt: new Date(),
    };

    const [created] = await this.db.insert(approvalRequests).values(values).returning();
    return created;
  }

  async approveRequest(
    id: number,
    organizationId: string,
    reviewedByUserId: string,
    reviewReason?: string | null,
  ) {
    const existing = await this.findRequestById(id, organizationId);
    if (!existing) return undefined;
    if (existing.status !== "pending") {
      throw new Error("Yêu cầu đã được xử lý trước đó");
    }

    const [updated] = await this.db
      .update(approvalRequests)
      .set({
        status: "approved",
        reviewedByUserId,
        reviewedAt: new Date(),
        reviewReason: reviewReason?.trim() || null,
      })
      .where(and(eq(approvalRequests.id, id), eq(approvalRequests.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async rejectRequest(
    id: number,
    organizationId: string,
    reviewedByUserId: string,
    reviewReason?: string | null,
  ) {
    const existing = await this.findRequestById(id, organizationId);
    if (!existing) return undefined;
    if (existing.status !== "pending") {
      throw new Error("Yêu cầu đã được xử lý trước đó");
    }

    const [updated] = await this.db
      .update(approvalRequests)
      .set({
        status: "rejected",
        reviewedByUserId,
        reviewedAt: new Date(),
        reviewReason: reviewReason?.trim() || null,
      })
      .where(and(eq(approvalRequests.id, id), eq(approvalRequests.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async markExecuted(
    id: number,
    organizationId: string,
    executionResult?: Record<string, unknown> | null,
  ) {
    const [updated] = await this.db
      .update(approvalRequests)
      .set({
        executedAt: new Date(),
        executionResult: executionResult ?? null,
      })
      .where(and(eq(approvalRequests.id, id), eq(approvalRequests.organizationId, organizationId)))
      .returning();

    return updated;
  }
}
