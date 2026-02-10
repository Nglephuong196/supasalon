/**
 * Frontend Permission Utilities
 *
 * These utilities help check permissions on the client side for UI hiding.
 * The actual authorization is enforced on the backend.
 */

import { ACTIONS, RESOURCES, hasPermission as baseHasPermission } from "@repo/constants";
import type { Action, Permissions, Resource } from "@repo/constants";

export { RESOURCES, ACTIONS, type Permissions, type Resource, type Action };

/**
 * Route to permission mapping
 * Maps dashboard routes to their required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, { resource: Resource; action: Action }> = {
  "/customers": { resource: RESOURCES.CUSTOMER, action: ACTIONS.READ },
  "/services": { resource: RESOURCES.SERVICE, action: ACTIONS.READ },
  "/bookings": { resource: RESOURCES.BOOKING, action: ACTIONS.READ },
  "/invoices": { resource: RESOURCES.INVOICE, action: ACTIONS.READ },
  "/employees": { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ },
  "/commission-settings": { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ },
  "/products": { resource: RESOURCES.PRODUCT, action: ACTIONS.READ },
};

/**
 * Check if user has a specific permission
 * Owners and Admins always have all permissions
 */
export function checkPermission(
  role: string | null | undefined,
  permissions: Permissions | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  // Owners and Admins bypass all permission checks
  if (role === "owner" || role === "admin") {
    return true;
  }

  return baseHasPermission(permissions, resource, action);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(
  role: string | null | undefined,
  permissions: Permissions | null | undefined,
  pathname: string,
): boolean {
  // Dashboard home is always accessible
  if (pathname === "/") {
    return true;
  }

  // Settings is always accessible for now
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return true;
  }

  // Find matching route permission
  const routeKey = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (!routeKey) {
    // No specific permission required for unknown routes
    return true;
  }

  const { resource, action } = ROUTE_PERMISSIONS[routeKey];
  return checkPermission(role, permissions, resource, action);
}

/**
 * Get permission flags for a resource (create, read, update, delete)
 * Used by pages to conditionally show/hide action buttons
 */
export function getResourcePermissions(
  role: string | null | undefined,
  permissions: Permissions | null | undefined,
  resource: Resource,
): { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean } {
  return {
    canRead: checkPermission(role, permissions, resource, ACTIONS.READ),
    canCreate: checkPermission(role, permissions, resource, ACTIONS.CREATE),
    canUpdate: checkPermission(role, permissions, resource, ACTIONS.UPDATE),
    canDelete: checkPermission(role, permissions, resource, ACTIONS.DELETE),
  };
}
