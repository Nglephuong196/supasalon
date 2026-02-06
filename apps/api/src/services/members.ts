import { eq, and } from "drizzle-orm";
import { member, memberPermissions, invitation, user, type Member } from "../db/schema";
import type { Database } from "../db";
import { hasPermission, type Permissions, type Resource, type Action } from "@repo/constants";

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
