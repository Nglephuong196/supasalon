import { Hono } from "hono";
import { MembersService } from "../services";
import type { Database } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const usersController = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// List all members of the organization
usersController.get("/", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const members = await service.findAll(organization.id);
  return c.json(members);
});

// Get a specific member details (if they belong to the organization)
usersController.get("/:id", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const userId = c.req.param("id");

  const member = await service.findByUserId(organization.id, userId);
  if (!member) return c.json({ error: "Member not found" }, 404);

  return c.json(member);
});

// Update current user profile (name, image)
usersController.patch("/me", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");

  const body = await c.req.json<{ name?: string; image?: string }>();
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.image !== undefined) updates.image = body.image || null;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No updates provided" }, 400);
  }

  const [updated] = await db
    .update(user)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(user.id, currentUser.id))
    .returning();

  return c.json(updated);
});

// Update member role
usersController.put("/:id/role", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const userId = c.req.param("id");
  const body = await c.req.json<{ role: string }>();

  // Only owners or admins can update roles (simple check, adjust as needed for better-auth roles)
  // better-auth roles are often 'owner', 'admin', 'member'
  if (organization.role !== "owner" && organization.role !== "admin") {
    return c.json({ error: "Insufficient permissions" }, 403);
  }

  try {
    const updated = await service.updateRole(
      organization.id,
      userId,
      body.role,
    );
    if (!updated) return c.json({ error: "Member not found" }, 404);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Remove member from organization
usersController.delete("/:id", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const userId = c.req.param("id");

  // Only owners or admins can remove members
  if (organization.role !== "owner" && organization.role !== "admin") {
    return c.json({ error: "Insufficient permissions" }, 403);
  }

  // Prevent removing yourself? OR require at least one owner?
  if (userId === c.get("user").id) {
    return c.json({ error: "Cannot remove yourself" }, 400);
  }

  const removed = await service.removeMember(organization.id, userId);
  if (!removed) return c.json({ error: "Member not found" }, 404);
  return c.json({ message: "Member removed" });
});
