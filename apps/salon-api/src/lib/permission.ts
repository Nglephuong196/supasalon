import type { Action, Resource } from "@repo/constants";

import type { Database } from "../db";
import { MembersService } from "../services";
import { forbidden } from "./http-error";

export async function requirePermission(
  db: Database,
  organization: { id: string; role: string },
  user: { id: string },
  resource: Resource,
  action: Action,
) {
  if (organization.role === "owner" || organization.role === "admin") return;

  const service = new MembersService(db);
  const member = await service.findByUserId(organization.id, user.id);

  if (!member) forbidden("Member not found in organization");

  const hasPermission = await service.checkPermission(member.id, organization.id, resource, action);
  if (!hasPermission) {
    forbidden(`Permission denied: ${resource}:${action}`);
  }
}
