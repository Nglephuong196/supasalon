import type { Action, Resource } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { requirePermission } from "../../lib/permission";
import { requireTenant, type TenantContext } from "../../lib/tenant";

const tenantCache = new WeakMap<Request, Promise<TenantContext>>();

export function getTenant(request: Request): Promise<TenantContext> {
  const cached = tenantCache.get(request);
  if (cached) return cached;
  const tenantPromise = requireTenant(db, request);
  tenantCache.set(request, tenantPromise);
  return tenantPromise;
}

export async function requirePermissionFor(
  request: Request,
  resource: Resource,
  action: Action,
): Promise<TenantContext> {
  const tenant = await getTenant(request);
  await requirePermission(db, tenant.organization, tenant.user, resource, action);
  return tenant;
}

export const protectedPlugin = new Elysia({ name: "protected-plugin" })
  .decorate("getTenant", getTenant)
  .decorate("requirePermissionFor", requirePermissionFor);
