import { Hono } from "hono";
import { MembersService } from "../services";
import { createAuth } from "../lib/auth";
import type { Database } from "../db";
import { formatPermissions, type Permissions, type Resource, type Action } from "@repo/constants";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const membersController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

membersController.get("/me", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const user = c.get("user");

  const member = await service.findByUserId(organization.id, user.id);
  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.json(member);
});

membersController.get("/", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  // Check permission? Maybe restrict listing members to members only (ensureTenant does this).
  const members = await service.findAll(organization.id);
  return c.json(members);
});

membersController.post("/", async (c) => {
  const db = c.get("db");
  const organization = c.get("organization");
  const { name, email, password, role } = await c.req.json();

  if (!name || !email || !password || !role) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Initialize auth
  const auth = createAuth(db, {
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
  });

  try {
    // 1. Create User
    // usage: auth.api.signUpEmail({ body: { ... } })
    // Note: asURL: false ensures we get the response object directly if possible,
    // but better-auth server SDK usually returns structured data.
    const userRes = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      asResponse: false, // Get data directly
    });

    if (!userRes?.user) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    // 2. Add to Organization
    // We can manually insert into member table using service or via auth plugin if available.
    // Using service manual insert is reliable since we have the logic.

    // Wait, better-auth organization plugin might have specific logic (like limits, etc).
    // But for now, manual insert is fine as we want to bypass invitation.

    // We need check if user is already member? Schema unique constraint might handle it but let's be safe.
    // Actually the service should handle it.

    const service = new MembersService(db);
    // We need a method to create member directly.
    await service.addMember(organization.id, userRes.user.id, role);

    return c.json({ user: userRes.user, message: "Member created successfully" });
  } catch (e: any) {
    // Handle better-auth errors (e.g. user already exists)
    if (e.body?.message) {
      return c.json({ error: e.body.message }, 400);
    }
    return c.json({ error: e.message || "Failed to create member" }, 500);
  }
});

membersController.delete("/remove-member", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const { memberIdOrEmail } = await c.req.json<{ memberIdOrEmail: string }>();

  if (!memberIdOrEmail) return c.json({ error: "Missing memberIdOrEmail" }, 400);

  let success;
  if (memberIdOrEmail.includes("@")) {
    success = await service.removeByEmail(organization.id, memberIdOrEmail);
  } else {
    success = await service.removeById(organization.id, memberIdOrEmail);
  }

  if (!success) return c.json({ error: "Member not found or could not be removed" }, 404);
  return c.json({ success: true });
});

membersController.put("/update-member-role", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const { memberId, role } = await c.req.json<{ memberId: string; role: string }>();
  const updated = await service.updateRole(organization.id, memberId, role);
  if (!updated) return c.json({ error: "Member not found" }, 404);
  return c.json(updated);
});

membersController.get("/invitations", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const invitations = await service.findInvitations(organization.id);
  return c.json(invitations);
});

membersController.put("/:id/permissions", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const id = c.req.param("id");
  const { permissions } = await c.req.json<{ permissions: Record<string, string[]> }>();

  // Only Owner/Admin can manage permissions (this is role-based, not permission-based)
  if (organization.role !== "owner" && organization.role !== "admin") {
    return c.json({ error: "Only owners and admins can manage permissions" }, 403);
  }

  // Validate permissions format
  let validatedPermissions: Permissions;
  try {
    validatedPermissions = formatPermissions(permissions);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }

  const updated = await service.updatePermissions(id, organization.id, validatedPermissions);
  if (!updated) return c.json({ error: "Member not found" }, 404);

  return c.json(updated);
});

// Get member permissions
membersController.get("/:id/permissions", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const id = c.req.param("id");

  const permissions = await service.getPermissions(id, organization.id);
  if (permissions === null) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.json({ permissions });
});

// Check if member has specific permission
membersController.post("/check-permission", async (c) => {
  const service = new MembersService(c.get("db"));
  const organization = c.get("organization");
  const { memberId, resource, action } = await c.req.json<{
    memberId: string;
    resource: Resource;
    action: Action;
  }>();

  if (!memberId || !resource || !action) {
    return c.json({ error: "Missing required fields: memberId, resource, action" }, 400);
  }

  const hasPermission = await service.checkPermission(memberId, organization.id, resource, action);

  return c.json({ hasPermission });
});
