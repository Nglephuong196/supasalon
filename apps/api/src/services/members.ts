import { type Action, type Permissions, type Resource, hasPermission } from "@repo/constants";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Database } from "../db";
import { type Member, invitation, member, memberPermissions, user } from "../db/schema";

type MemberListOptions = {
  page?: number;
  limit?: number;
  search?: string;
};

type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PaginatedMemberRow = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  permissions: Array<{
    id: number;
    createdAt: Date;
    memberId: string;
    permissions: Permissions;
  }>;
};

export class MembersService {
  constructor(private db: Database) {}

  async findAll(organizationId: string) {
    const rows = await this.db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: true,
        permissions: true,
      },
    });
    return rows;
  }

  async findPage(
    organizationId: string,
    options: MemberListOptions,
  ): Promise<PaginatedResult<PaginatedMemberRow>> {
    const { page = 1, limit = 20, search } = options;
    const conditions = [eq(member.organizationId, organizationId)];

    if (search) {
      const pattern = `%${search.trim()}%`;
      conditions.push(or(like(user.name, pattern), like(user.email, pattern))!);
    }

    const whereClause = and(...conditions);
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(whereClause)
      .get();

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select({
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(whereClause)
      .orderBy(desc(member.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const memberIds = rows.map((row) => row.id);
    const permissionsRows =
      memberIds.length > 0
        ? await this.db.query.memberPermissions.findMany({
            where: inArray(memberPermissions.memberId, memberIds),
          })
        : [];

    const permissionsByMemberId = new Map(permissionsRows.map((row) => [row.memberId, row]));

    const data = rows.map((row) => ({
      ...row,
      permissions: permissionsByMemberId.get(row.id) ? [permissionsByMemberId.get(row.id)!] : [],
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(memberId: string, organizationId: string) {
    return this.db.query.member.findFirst({
      where: and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
      with: {
        user: true,
        permissions: true,
      },
    });
  }

  async findInvitations(organizationId: string) {
    return this.db.query.invitation.findMany({
      where: eq(invitation.organizationId, organizationId),
    });
  }

  async updatePermissions(memberId: string, organizationId: string, permissions: Permissions) {
    // Verify member belongs to org
    const targetMember = await this.findById(memberId, organizationId);
    if (!targetMember) return null;

    // Check if permissions record exists
    const existing = await this.db.query.memberPermissions.findFirst({
      where: eq(memberPermissions.memberId, memberId),
    });

    if (existing) {
      // Update existing permissions
      await this.db
        .update(memberPermissions)
        .set({ permissions: permissions as any })
        .where(eq(memberPermissions.memberId, memberId));
    } else {
      // Insert new permissions
      await this.db.insert(memberPermissions).values({
        memberId,
        permissions: permissions as any,
      });
    }

    return this.findById(memberId, organizationId);
  }

  async addMember(organizationId: string, userId: string, role: string) {
    // Generate a random ID for the member entry
    const id = crypto.randomUUID();

    await this.db
      .insert(member)
      .values({
        id,
        organizationId,
        userId,
        role,
        createdAt: new Date(),
      })
      .returning();

    return this.findById(id, organizationId);
  }
  async findByUserId(organizationId: string, userId: string) {
    return this.db.query.member.findFirst({
      where: and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
      with: {
        user: true,
        permissions: true,
      },
    });
  }

  async updateRole(organizationId: string, memberId: string, role: string) {
    const targetMember = await this.findById(memberId, organizationId);
    if (!targetMember) return null;

    await this.db.update(member).set({ role }).where(eq(member.id, memberId)).returning();

    return this.findById(memberId, organizationId);
  }

  async removeMember(organizationId: string, userId: string) {
    const targetMember = await this.findByUserId(organizationId, userId);
    if (!targetMember) return null;

    await this.db.delete(member).where(eq(member.id, targetMember.id)).returning();

    return true;
  }

  async removeById(organizationId: string, memberId: string) {
    const targetMember = await this.findById(memberId, organizationId);
    if (!targetMember) return false;

    await this.db.delete(member).where(eq(member.id, memberId)).returning();
    return true;
  }

  async removeByEmail(organizationId: string, email: string) {
    // Find user by email
    const userFound = await this.db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!userFound) return false;

    return this.removeMember(organizationId, userFound.id);
  }

  async getPermissions(memberId: string, organizationId: string): Promise<Permissions | null> {
    // Verify member belongs to org
    const targetMember = await this.findById(memberId, organizationId);
    if (!targetMember) return null;

    const permissionRecord = await this.db.query.memberPermissions.findFirst({
      where: eq(memberPermissions.memberId, memberId),
    });

    return (permissionRecord?.permissions as Permissions) || null;
  }

  async checkPermission(
    memberId: string,
    organizationId: string,
    resource: Resource,
    action: Action,
  ): Promise<boolean> {
    const userPermissions = await this.getPermissions(memberId, organizationId);
    return hasPermission(userPermissions, resource, action);
  }
}
