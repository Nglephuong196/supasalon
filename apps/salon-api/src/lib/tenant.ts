import { and, eq } from "drizzle-orm";

import type { Database } from "../db";
import { member } from "../db";
import { auth } from "./auth";
import { badRequest, forbidden, unauthorized } from "./http-error";

export type TenantContext = {
  organization: { id: string; role: string };
  user: any;
};

export async function requireTenant(db: Database, request: Request): Promise<TenantContext> {
  const orgIdHeader = request.headers.get("X-Organization-Id") || request.headers.get("X-Salon-Id");

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) unauthorized();

  const activeOrgId =
    typeof (session.session as { activeOrganizationId?: unknown } | undefined)?.activeOrganizationId ===
    "string"
      ? (session.session as { activeOrganizationId: string }).activeOrganizationId
      : null;

  const candidateOrgIds = [orgIdHeader, activeOrgId]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .filter((value, index, array) => array.indexOf(value) === index);

  if (candidateOrgIds.length === 0) badRequest("X-Organization-Id header is required");

  let resolvedOrgId: string | null = null;
  let orgMember: { role: string } | null = null;

  for (const orgId of candidateOrgIds) {
    const found = (
      await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)))
    )[0];
    if (found) {
      resolvedOrgId = orgId;
      orgMember = found;
      break;
    }
  }

  if (!resolvedOrgId || !orgMember) forbidden("You are not a member of this organization");

  return {
    organization: { id: resolvedOrgId, role: orgMember.role },
    user: session.user,
  };
}
