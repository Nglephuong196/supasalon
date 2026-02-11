// Permission Resources
export const RESOURCES = {
  INVOICE: "invoice",
  CUSTOMER: "customer",
  EMPLOYEE: "employee",
  PRODUCT: "product",
  SERVICE: "service",
  BOOKING: "booking",
  REPORT: "report",
} as const;

// Permission Actions
export const ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

// Type definitions
export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
export type Permissions = Partial<Record<Resource, Action[]>>;

// Helper Functions

/**
 * Check if a user has a specific permission
 * @param userPermissions - The user's permission object
 * @param resource - The resource to check (e.g., 'customer', 'invoice')
 * @param action - The action to check (e.g., 'read', 'create')
 * @returns true if the user has the permission, false otherwise
 */
export function hasPermission(
  userPermissions: Permissions | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  if (!userPermissions) return false;

  const resourcePermissions = userPermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

/**
 * Validate and format permissions object
 * @param permissions - The permissions object to validate
 * @returns The validated permissions object
 * @throws Error if the permissions object is invalid
 */
export function formatPermissions(permissions: Record<string, string[]>): Permissions {
  const validatedPermissions: Permissions = {};

  for (const [resource, actions] of Object.entries(permissions)) {
    // Check if resource is valid
    const validResources = Object.values(RESOURCES);
    if (!validResources.includes(resource as Resource)) {
      throw new Error(
        `Invalid resource: ${resource}. Valid resources are: ${validResources.join(", ")}`,
      );
    }

    // Check if all actions are valid
    const validActions = Object.values(ACTIONS);
    for (const action of actions) {
      if (!validActions.includes(action as Action)) {
        throw new Error(
          `Invalid action: ${action} for resource ${resource}. Valid actions are: ${validActions.join(", ")}`,
        );
      }
    }

    validatedPermissions[resource as Resource] = actions as Action[];
  }

  return validatedPermissions;
}
