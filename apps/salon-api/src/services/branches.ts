import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "../db";
import { bookings, branches, invoices, member, memberBranches } from "../db";

export type BranchInput = {
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  managerMemberId?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
};

export class BranchesService {
  constructor(private db: Database) {}

  async list(organizationId: string) {
    return this.db.query.branches.findMany({
      where: eq(branches.organizationId, organizationId),
      with: {
        manager: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(branches.isDefault), asc(branches.name)],
    });
  }

  async findById(organizationId: string, branchId: number) {
    return this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)),
      with: {
        manager: {
          with: {
            user: true,
          },
        },
      },
    });
  }

  private async ensureMemberInOrganization(organizationId: string, memberId: string) {
    const found = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, organizationId), eq(member.id, memberId)),
    });
    if (!found) {
      throw new Error("Nhân viên không thuộc chi nhánh này");
    }
    return found;
  }

  async create(organizationId: string, input: BranchInput) {
    if (!input.name?.trim()) {
      throw new Error("Tên chi nhánh là bắt buộc");
    }

    if (input.managerMemberId) {
      await this.ensureMemberInOrganization(organizationId, input.managerMemberId);
    }

    const existingCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(branches)
      .where(eq(branches.organizationId, organizationId))
      .then((rows) => Number(rows[0]?.count ?? 0));

    const shouldBeDefault = Boolean(input.isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await this.db
        .update(branches)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(and(eq(branches.organizationId, organizationId), eq(branches.isDefault, true)));
    }

    const [created] = await this.db
      .insert(branches)
      .values({
        organizationId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        managerMemberId: input.managerMemberId ?? null,
        isActive: input.isActive ?? true,
        isDefault: shouldBeDefault,
      })
      .returning();

    return this.findById(organizationId, created.id);
  }

  async update(organizationId: string, branchId: number, input: Partial<BranchInput>) {
    const existing = await this.findById(organizationId, branchId);
    if (!existing) return undefined;

    if (input.managerMemberId) {
      await this.ensureMemberInOrganization(organizationId, input.managerMemberId);
    }

    if (input.isDefault) {
      await this.db
        .update(branches)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(and(eq(branches.organizationId, organizationId), eq(branches.isDefault, true)));
    }

    const [updated] = await this.db
      .update(branches)
      .set({
        name: input.name ? input.name.trim() : existing.name,
        code: typeof input.code === "string" ? input.code.trim() || null : existing.code,
        address:
          typeof input.address === "string" ? input.address.trim() || null : existing.address,
        phone: typeof input.phone === "string" ? input.phone.trim() || null : existing.phone,
        managerMemberId:
          typeof input.managerMemberId !== "undefined"
            ? input.managerMemberId || null
            : existing.managerMemberId,
        isActive: typeof input.isActive === "boolean" ? input.isActive : existing.isActive,
        isDefault: typeof input.isDefault === "boolean" ? input.isDefault : existing.isDefault,
        updatedAt: new Date(),
      })
      .where(and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)))
      .returning();

    if (existing.isDefault && updated && !updated.isDefault) {
      const replacement = await this.db.query.branches.findFirst({
        where: and(eq(branches.organizationId, organizationId), eq(branches.isActive, true)),
        orderBy: [asc(branches.createdAt)],
      });
      if (replacement) {
        await this.db
          .update(branches)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(
            and(
              eq(branches.organizationId, organizationId),
              eq(branches.id, replacement.id),
            ),
          );
      }
    }

    return this.findById(organizationId, branchId);
  }

  async delete(organizationId: string, branchId: number) {
    const existing = await this.findById(organizationId, branchId);
    if (!existing) return undefined;

    const [bookingCount, invoiceCount] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(and(eq(bookings.organizationId, organizationId), eq(bookings.branchId, branchId)))
        .then((rows) => Number(rows[0]?.count ?? 0)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(and(eq(invoices.organizationId, organizationId), eq(invoices.branchId, branchId)))
        .then((rows) => Number(rows[0]?.count ?? 0)),
    ]);

    if (bookingCount > 0 || invoiceCount > 0) {
      throw new Error(
        "Không thể xóa chi nhánh đã có dữ liệu booking/hóa đơn. Hãy ngừng hoạt động thay vì xóa.",
      );
    }

    const [deleted] = await this.db
      .delete(branches)
      .where(and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)))
      .returning();

    if (existing.isDefault) {
      const replacement = await this.db.query.branches.findFirst({
        where: eq(branches.organizationId, organizationId),
        orderBy: [asc(branches.createdAt)],
      });
      if (replacement) {
        await this.db
          .update(branches)
          .set({
            isDefault: true,
            updatedAt: new Date(),
          })
          .where(and(eq(branches.organizationId, organizationId), eq(branches.id, replacement.id)));
      }
    }

    return deleted;
  }

  async listMembers(organizationId: string, branchId: number) {
    return this.db.query.memberBranches.findMany({
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
        branch: true,
      },
      orderBy: [desc(memberBranches.isPrimary), asc(memberBranches.createdAt)],
    });
  }

  async assignMember(
    organizationId: string,
    branchId: number,
    memberId: string,
    options?: { isPrimary?: boolean },
  ) {
    const branch = await this.findById(organizationId, branchId);
    if (!branch) {
      throw new Error("Chi nhánh không tồn tại");
    }

    await this.ensureMemberInOrganization(organizationId, memberId);

    if (options?.isPrimary) {
      await this.db
        .update(memberBranches)
        .set({ isPrimary: false })
        .where(
          and(
            eq(memberBranches.organizationId, organizationId),
            eq(memberBranches.memberId, memberId),
          ),
        );
    }

    const existing = await this.db.query.memberBranches.findFirst({
      where: and(
        eq(memberBranches.organizationId, organizationId),
        eq(memberBranches.branchId, branchId),
        eq(memberBranches.memberId, memberId),
      ),
    });

    if (existing) {
      const [updated] = await this.db
        .update(memberBranches)
        .set({ isPrimary: options?.isPrimary ?? existing.isPrimary })
        .where(eq(memberBranches.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(memberBranches)
      .values({
        organizationId,
        branchId,
        memberId,
        isPrimary: options?.isPrimary ?? false,
      })
      .returning();

    return created;
  }

  async unassignMember(organizationId: string, branchId: number, memberId: string) {
    const [removed] = await this.db
      .delete(memberBranches)
      .where(
        and(
          eq(memberBranches.organizationId, organizationId),
          eq(memberBranches.branchId, branchId),
          eq(memberBranches.memberId, memberId),
        ),
      )
      .returning();

    const hasPrimary = await this.db.query.memberBranches.findFirst({
      where: and(
        eq(memberBranches.organizationId, organizationId),
        eq(memberBranches.memberId, memberId),
        eq(memberBranches.isPrimary, true),
      ),
    });

    if (!hasPrimary) {
      const fallback = await this.db.query.memberBranches.findFirst({
        where: and(
          eq(memberBranches.organizationId, organizationId),
          eq(memberBranches.memberId, memberId),
        ),
        orderBy: [asc(memberBranches.createdAt)],
      });

      if (fallback) {
        await this.db
          .update(memberBranches)
          .set({ isPrimary: true })
          .where(eq(memberBranches.id, fallback.id));
      }
    }

    return removed;
  }

  async getDefaultBranch(organizationId: string) {
    const existingDefault = await this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.isDefault, true)),
    });
    if (existingDefault) return existingDefault;

    return this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.isActive, true)),
      orderBy: [asc(branches.createdAt)],
    });
  }

  async listByMember(organizationId: string, memberId: string) {
    const assignments = await this.db.query.memberBranches.findMany({
      where: and(
        eq(memberBranches.organizationId, organizationId),
        eq(memberBranches.memberId, memberId),
      ),
      with: {
        branch: true,
      },
      orderBy: [desc(memberBranches.isPrimary), asc(memberBranches.createdAt)],
    });

    if (assignments.length > 0) {
      return assignments;
    }

    const defaultBranch = await this.getDefaultBranch(organizationId);
    if (!defaultBranch) return [];

    const [created] = await this.db
      .insert(memberBranches)
      .values({
        organizationId,
        memberId,
        branchId: defaultBranch.id,
        isPrimary: true,
      })
      .returning();

    return this.db.query.memberBranches.findMany({
      where: eq(memberBranches.id, created.id),
      with: { branch: true },
    });
  }

  async resolveBranchId(
    organizationId: string,
    options?: {
      branchId?: number | null;
      preferredMemberId?: string | null;
    },
  ) {
    if (options?.branchId && Number.isInteger(options.branchId) && options.branchId > 0) {
      const branch = await this.findById(organizationId, options.branchId);
      if (!branch) {
        throw new Error("Chi nhánh không hợp lệ");
      }
      return branch.id;
    }

    if (options?.preferredMemberId) {
      const primaryAssignment = await this.db.query.memberBranches.findFirst({
        where: and(
          eq(memberBranches.organizationId, organizationId),
          eq(memberBranches.memberId, options.preferredMemberId),
          eq(memberBranches.isPrimary, true),
        ),
      });
      if (primaryAssignment) return primaryAssignment.branchId;

      const anyAssignment = await this.db.query.memberBranches.findFirst({
        where: and(
          eq(memberBranches.organizationId, organizationId),
          eq(memberBranches.memberId, options.preferredMemberId),
        ),
      });
      if (anyAssignment) return anyAssignment.branchId;
    }

    const defaultBranch = await this.getDefaultBranch(organizationId);
    return defaultBranch?.id ?? null;
  }
}
