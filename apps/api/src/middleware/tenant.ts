import { createMiddleware } from "hono/factory";
import { eq, and } from "drizzle-orm";
import { member } from "../db/schema";
import { createAuth } from "../lib/auth";
import type { Database } from "../db";

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
    };
};

export const ensureTenant = createMiddleware<Env>(async (c, next) => {
    const orgIdHeader = c.req.header("X-Organization-Id") || c.req.header("X-Salon-Id");

    // Allow bypassing tenant check for specific public paths if needed, 
    // but generally this middleware should only be applied to protected routes.

    if (!orgIdHeader) {
        return c.json({ error: "X-Organization-Id header is required" }, 400);
    }

    const organizationId = orgIdHeader; // string ID now

    const db = c.get("db");
    const auth = createAuth(db, c.env);

    // better-auth needs the request headers to verify the session
    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const orgMember = await db
        .select()
        .from(member)
        .where(
            and(
                eq(member.organizationId, organizationId),
                eq(member.userId, session.user.id)
            )
        )
        .get();

    if (!orgMember) {
        return c.json({ error: "You are not a member of this organization" }, 403);
    }

    c.set("organization", { id: organizationId, role: orgMember.role });
    c.set("user", session.user);

    await next();
});
