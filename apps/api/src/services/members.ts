import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { member, user } from "../db/schema";

export class MembersService {
    constructor(private db: Database) { }

    async findAll(organizationId: string) {
        return this.db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: member.role,
                joinedAt: member.createdAt,
            })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .where(eq(member.organizationId, organizationId));
    }

    async findByUserId(organizationId: string, userId: string) {
        return this.db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: member.role,
                joinedAt: member.createdAt,
                memberId: member.id,
            })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
            .get();
    }

    async addMember(organizationId: string, userId: string, role: string = "member") {
        // Check if already member
        const existing = await this.db.select().from(member).where(and(eq(member.organizationId, organizationId), eq(member.userId, userId))).get();
        if (existing) {
            throw new Error("User is already a member of this organization");
        }

        // Generate ID for member if needed (better-auth uses CUID/UUID usually, I might need a generator or let DB handle if I have one)
        // Since my schema defined id as text primary key, I need to generate it.
        // I'll import crypto for UUID
        const id = crypto.randomUUID();

        const result = await this.db.insert(member).values({
            id,
            organizationId,
            userId,
            role,
            createdAt: new Date(),
        }).returning();
        return result[0];
    }

    async updateRole(organizationId: string, userId: string, role: string) {
        const result = await this.db.update(member)
            .set({ role })
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
            .returning();
        return result[0];
    }

    async removeMember(organizationId: string, userId: string) {
        const result = await this.db.delete(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
            .returning();
        return result[0];
    }
}
