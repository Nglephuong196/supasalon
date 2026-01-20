import { createMiddleware } from "hono/factory";
import { MembersService } from "../services";
import type { Database } from "../db";
import type { Resource, Action } from "@repo/constants";

type Env = {
    Bindings: {
        DB: D1Database;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
    };
    Variables: {
        db: Database;
        organization: { id: string; role: string };
        user: any;
        member: { id: string; role: string }; // Add member info to context
    };
};

/**
 * Middleware factory to check if current user has specific permission.
 * Owners and Admins automatically bypass permission checks.
 * 
 * @param resource - The resource to check (e.g., 'customer', 'invoice')
 * @param action - The action to check (e.g., 'read', 'create')
 * @returns Hono middleware that enforces the permission
 * 
 * @example
 * ```typescript
 * import { requirePermission } from "../middleware/permission";
 * import { RESOURCES, ACTIONS } from "@repo/constants";
 * 
 * customersController.get("/", requirePermission(RESOURCES.CUSTOMER, ACTIONS.READ), async (c) => {
 *   // Only runs if user has customer:read permission
 * });
 * ```
 */
export const requirePermission = (resource: Resource, action: Action) => {
    return createMiddleware<Env>(async (c, next) => {
        const db = c.get("db");
        const organization = c.get("organization");
        const user = c.get("user");

        // Owners and Admins bypass all permission checks
        if (organization.role === "owner" || organization.role === "admin") {
            return next();
        }

        const service = new MembersService(db);
        const member = await service.findByUserId(organization.id, user.id);

        if (!member) {
            return c.json({ error: "Member not found in organization" }, 403);
        }

        // Store member info in context for potential use in route handlers
        c.set("member", { id: member.id, role: member.role });

        const hasPermission = await service.checkPermission(
            member.id,
            organization.id,
            resource,
            action
        );

        if (!hasPermission) {
            return c.json(
                {
                    error: "Permission denied",
                    required: `${resource}:${action}`,
                },
                403
            );
        }

        await next();
    });
};

/**
 * Middleware factory for routes that require ANY of the specified permissions.
 * Useful for routes where multiple permission levels can grant access.
 * 
 * @param permissions - Array of [resource, action] tuples
 * @returns Hono middleware that enforces at least one permission
 * 
 * @example
 * ```typescript
 * // User needs either customer:read OR report:read
 * customersController.get("/summary", requireAnyPermission([
 *   [RESOURCES.CUSTOMER, ACTIONS.READ],
 *   [RESOURCES.REPORT, ACTIONS.READ],
 * ]), async (c) => { ... });
 * ```
 */
export const requireAnyPermission = (permissions: [Resource, Action][]) => {
    return createMiddleware<Env>(async (c, next) => {
        const db = c.get("db");
        const organization = c.get("organization");
        const user = c.get("user");

        // Owners and Admins bypass all permission checks
        if (organization.role === "owner" || organization.role === "admin") {
            return next();
        }

        const service = new MembersService(db);
        const member = await service.findByUserId(organization.id, user.id);

        if (!member) {
            return c.json({ error: "Member not found in organization" }, 403);
        }

        c.set("member", { id: member.id, role: member.role });

        // Check if user has ANY of the required permissions
        for (const [resource, action] of permissions) {
            const hasPermission = await service.checkPermission(
                member.id,
                organization.id,
                resource,
                action
            );
            if (hasPermission) {
                return next();
            }
        }

        return c.json(
            {
                error: "Permission denied",
                required: permissions.map(([r, a]) => `${r}:${a}`).join(" OR "),
            },
            403
        );
    });
};
