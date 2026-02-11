import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db, user } from "../../db";
import { MembersService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const usersProtectedRoutes = new Elysia({ name: "protected-users-routes" })
  .use(protectedPlugin)
  .group("/users", (app) =>
    app
    .get("/", async ({ request }) => {
      const { organization } = await getTenant(request);
      return new MembersService(db).findAll(organization.id);
    })
    .get("/:id", async ({ request, params, set }) => {
      const { organization } = await getTenant(request);
      const member = await new MembersService(db).findByUserId(organization.id, params.id);
      if (!member) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return member;
    })
    .patch("/me", async ({ request, set }) => {
      const { user: currentUser } = await getTenant(request);
      const body = (await request.json()) as { name?: string; image?: string };
      const updates: any = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.image !== undefined) updates.image = body.image || null;
      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: "No updates provided" };
      }
      const [updated] = await db
        .update(user)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(user.id, currentUser.id))
        .returning();
      return updated;
    })
    .put("/:id/role", async ({ request, params, set }) => {
      const { organization } = await getTenant(request);
      if (organization.role !== "owner" && organization.role !== "admin") {
        set.status = 403;
        return { error: "Insufficient permissions" };
      }
      const body = (await request.json()) as { role: string };
      try {
        const updated = await new MembersService(db).updateRole(organization.id, params.id, body.role);
        if (!updated) {
          set.status = 404;
          return { error: "Member not found" };
        }
        return updated;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    })
    .delete("/:id", async ({ request, params, set }) => {
      const { organization, user: currentUser } = await getTenant(request);
      if (organization.role !== "owner" && organization.role !== "admin") {
        set.status = 403;
        return { error: "Insufficient permissions" };
      }
      if (params.id === currentUser.id) {
        set.status = 400;
        return { error: "Cannot remove yourself" };
      }
      const removed = await new MembersService(db).removeMember(organization.id, params.id);
      if (!removed) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return { message: "Member removed" };
    }),
  );
