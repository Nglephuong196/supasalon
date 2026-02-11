import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../db";
import { activityLogs } from "../db";

export type ActivityEntityType =
  | "invoice"
  | "booking"
  | "branch"
  | "commission_payout"
  | "payroll_cycle"
  | "payroll_item"
  | "cash_session"
  | "cash_transaction"
  | "invoice_payment"
  | "booking_reminder"
  | "prepaid_card"
  | "approval_request";

export class ActivityLogsService {
  constructor(private db: Database) {}

  async log(input: {
    organizationId: string;
    actorUserId?: string | null;
    entityType: ActivityEntityType;
    entityId?: number | null;
    action: string;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const [created] = await this.db
      .insert(activityLogs)
      .values({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        action: input.action,
        reason: input.reason ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();
    return created;
  }

  async listByEntity(organizationId: string, entityType: ActivityEntityType, entityId: number) {
    return this.db.query.activityLogs.findMany({
      where: and(
        eq(activityLogs.organizationId, organizationId),
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId),
      ),
      with: {
        actor: true,
      },
      orderBy: [desc(activityLogs.createdAt)],
    });
  }
}
