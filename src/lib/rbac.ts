export type Role = "OWNER" | "ADMIN" | "COACH" | "RECEPTION" | "MEMBER" | "GUEST";

// Numeric matrix to allow easy greater-than / less-than permission checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 50,
  ADMIN: 40,
  COACH: 30,
  RECEPTION: 20,
  MEMBER: 10,
  GUEST: 0
};

/**
 * Checks if a given user's role satisfies the required minimum role.
 * e.g., hasPermission("ADMIN", "COACH") -> true
 * e.g., hasPermission("RECEPTION", "ADMIN") -> false
 */
export function hasPermission(userRole: Role | undefined | null | string, requiredRole: Role): boolean {
  if (!userRole) return false;
  const roleValue = ROLE_HIERARCHY[userRole as Role] ?? 0;
  return roleValue >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Defines which paths require which minimum role.
 * Used heavily in the middleware to automatically block invalid access.
 */
export const RoutePermissions: { pathPrefix: string; minimumRole: Role }[] = [
  { pathPrefix: "/admin/settings", minimumRole: "OWNER" },
  { pathPrefix: "/admin", minimumRole: "ADMIN" },
  { pathPrefix: "/coach", minimumRole: "COACH" },
  { pathPrefix: "/reception", minimumRole: "RECEPTION" },
  { pathPrefix: "/dashboard", minimumRole: "MEMBER" },
  { pathPrefix: "/bookings", minimumRole: "MEMBER" },
];
