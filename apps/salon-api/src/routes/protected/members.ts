import { formatPermissions, type Action, type Permissions, type Resource } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { auth } from "../../lib/auth";
import { getQuery } from "../../lib/query";
import { MembersService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const membersProtectedRoutes = new Elysia({ name: "protected-members-routes" })
  .use(protectedPlugin)
  .group("/members", (app) =>
    app
    .get("/me", async ({ request, set }) => {
      const tenant = await getTenant(request);
      const member = await new MembersService(db).findByUserId(tenant.organization.id, tenant.user.id);
      if (!member) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return member;
    })
    .get("/", async ({ request }) => {
      const { organization } = await getTenant(request);
      const query = getQuery(request);
      const paginated = query.get("paginated") === "1";
      const service = new MembersService(db);
      if (!paginated) return service.findAll(organization.id);
      const page = Number.parseInt(query.get("page") || "1", 10);
      const limit = Number.parseInt(query.get("limit") || "20", 10);
      const search = query.get("search") || "";
      return service.findPage(organization.id, {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20,
        search,
      });
    })
    .post("/", async ({ request, set }) => {
      const { organization } = await getTenant(request);
      const { name, email, password, role } = await request.json() as any;
      if (!name || !email || !password || !role) {
        set.status = 400;
        return { error: "Missing required fields" };
      }

      try {
        const userRes = await auth.api.signUpEmail({
          body: { email, password, name },
          asResponse: false,
        });

        if (!userRes?.user) {
          set.status = 500;
          return { error: "Failed to create user" };
        }

        await new MembersService(db).addMember(organization.id, userRes.user.id, role);
        return { user: userRes.user, message: "Member created successfully" };
      } catch (e: any) {
        set.status = e.body?.message ? 400 : 500;
        return { error: e.body?.message || e.message || "Failed to create member" };
      }
    })
    .delete("/remove-member", async ({ request, set }) => {
      const { organization } = await getTenant(request);
      const { memberIdOrEmail } = await request.json() as { memberIdOrEmail: string };
      if (!memberIdOrEmail) {
        set.status = 400;
        return { error: "Missing memberIdOrEmail" };
      }
      const service = new MembersService(db);
      const success = memberIdOrEmail.includes("@")
        ? await service.removeByEmail(organization.id, memberIdOrEmail)
        : await service.removeById(organization.id, memberIdOrEmail);
      if (!success) {
        set.status = 404;
        return { error: "Member not found or could not be removed" };
      }
      return { success: true };
    })
    .put("/update-member-role", async ({ request, set }) => {
      const { organization } = await getTenant(request);
      const { memberId, role } = await request.json() as { memberId: string; role: string };
      const updated = await new MembersService(db).updateRole(organization.id, memberId, role);
      if (!updated) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return updated;
    })
    .get("/invitations", async ({ request }) => {
      const { organization } = await getTenant(request);
      return new MembersService(db).findInvitations(organization.id);
    })
    .put("/:id/permissions", async ({ request, params, set }) => {
      const { organization } = await getTenant(request);
      if (organization.role !== "owner" && organization.role !== "admin") {
        set.status = 403;
        return { error: "Only owners and admins can manage permissions" };
      }
      const { permissions } = await request.json() as { permissions: Record<string, string[]> };
      let validatedPermissions: Permissions;
      try {
        validatedPermissions = formatPermissions(permissions);
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
      const updated = await new MembersService(db).updatePermissions(params.id, organization.id, validatedPermissions);
      if (!updated) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return updated;
    })
    .get("/:id/permissions", async ({ request, params, set }) => {
      const { organization } = await getTenant(request);
      const permissions = await new MembersService(db).getPermissions(params.id, organization.id);
      if (permissions === null) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return { permissions };
    })
    .post("/check-permission", async ({ request, set }) => {
      const { organization } = await getTenant(request);
      const { memberId, resource, action } = await request.json() as { memberId: string; resource: Resource; action: Action };
      if (!memberId || !resource || !action) {
        set.status = 400;
        return { error: "Missing required fields: memberId, resource, action" };
      }
      const hasPermission = await new MembersService(db).checkPermission(memberId, organization.id, resource, action);
      return { hasPermission };
    }),
  );
