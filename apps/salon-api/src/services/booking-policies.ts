import { eq } from "drizzle-orm";

import type { Database, NewBookingPolicy } from "../db";
import { bookingPolicies } from "../db";

export type BookingPolicyInput = {
  preventStaffOverlap?: boolean;
  bufferMinutes?: number;
  requireDeposit?: boolean;
  defaultDepositAmount?: number;
  cancellationWindowHours?: number;
};

export class BookingPoliciesService {
  constructor(private db: Database) {}

  async getByOrganizationId(organizationId: string) {
    const policy = await this.db.query.bookingPolicies.findFirst({
      where: eq(bookingPolicies.organizationId, organizationId),
    });

    if (policy) return policy;

    return {
      id: 0,
      organizationId,
      preventStaffOverlap: true,
      bufferMinutes: 0,
      requireDeposit: false,
      defaultDepositAmount: 0,
      cancellationWindowHours: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async upsert(organizationId: string, input: BookingPolicyInput) {
    const existing = await this.db.query.bookingPolicies.findFirst({
      where: eq(bookingPolicies.organizationId, organizationId),
    });

    const payload: Partial<NewBookingPolicy> = {
      preventStaffOverlap:
        typeof input.preventStaffOverlap === "boolean" ? input.preventStaffOverlap : undefined,
      bufferMinutes:
        typeof input.bufferMinutes === "number" ? Math.max(0, Math.trunc(input.bufferMinutes)) : undefined,
      requireDeposit: typeof input.requireDeposit === "boolean" ? input.requireDeposit : undefined,
      defaultDepositAmount:
        typeof input.defaultDepositAmount === "number" ? Math.max(0, input.defaultDepositAmount) : undefined,
      cancellationWindowHours:
        typeof input.cancellationWindowHours === "number"
          ? Math.max(0, Math.trunc(input.cancellationWindowHours))
          : undefined,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(bookingPolicies)
        .set(payload)
        .where(eq(bookingPolicies.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(bookingPolicies)
      .values({
        organizationId,
        preventStaffOverlap: payload.preventStaffOverlap ?? true,
        bufferMinutes: payload.bufferMinutes ?? 0,
        requireDeposit: payload.requireDeposit ?? false,
        defaultDepositAmount: payload.defaultDepositAmount ?? 0,
        cancellationWindowHours: payload.cancellationWindowHours ?? 2,
      })
      .returning();

    return created;
  }
}
