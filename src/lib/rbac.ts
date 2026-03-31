import type { UserRole } from '@prisma/client';

export type PermissionResource =
  | 'organization'
  | 'members'
  | 'events'
  | 'facilities'
  | 'waitlist'
  | 'bookings'
  | 'coaching'
  | 'compliance'
  | 'incidents'
  | 'finance'
  | 'campaigns'
  | 'analytics'
  | 'privacy';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export';

type PermissionSet = Partial<Record<PermissionResource, PermissionAction[]>>;

const permissionsByRole: Record<UserRole, PermissionSet> = {
  OWNER: {
    organization: ['read', 'update'],
    members: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    events: ['read', 'create', 'update', 'delete', 'approve'],
    facilities: ['read', 'create', 'update', 'delete'],
    waitlist: ['read', 'create', 'update', 'delete', 'approve'],
    bookings: ['read', 'create', 'update', 'delete', 'approve'],
    coaching: ['read', 'create', 'update', 'delete', 'approve'],
    compliance: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    incidents: ['read', 'create', 'update', 'delete', 'approve'],
    finance: ['read', 'create', 'update', 'delete', 'export'],
    campaigns: ['read', 'create', 'update', 'delete', 'approve'],
    analytics: ['read', 'export'],
    privacy: ['read', 'approve', 'export'],
  },
  ADMIN: {
    organization: ['read'],
    members: ['read', 'create', 'update', 'approve', 'export'],
    events: ['read', 'create', 'update', 'delete', 'approve'],
    facilities: ['read', 'create', 'update', 'delete'],
    waitlist: ['read', 'create', 'update', 'approve'],
    bookings: ['read', 'create', 'update', 'delete', 'approve'],
    coaching: ['read', 'create', 'update', 'approve'],
    compliance: ['read', 'create', 'update', 'approve', 'export'],
    incidents: ['read', 'create', 'update', 'approve'],
    finance: ['read', 'export'],
    campaigns: ['read', 'create', 'update', 'approve'],
    analytics: ['read', 'export'],
    privacy: ['read', 'approve', 'export'],
  },
  COACH: {
    members: ['read'],
    events: ['read'],
    waitlist: ['read'],
    bookings: ['read', 'create', 'update'],
    coaching: ['read', 'create', 'update'],
    compliance: ['read'],
    incidents: ['read', 'create'],
    analytics: ['read'],
  },
  RECEPTION: {
    members: ['read', 'update'],
    events: ['read'],
    waitlist: ['read', 'create', 'update'],
    bookings: ['read', 'create', 'update'],
    compliance: ['read', 'update'],
    incidents: ['read', 'create'],
    analytics: ['read'],
    privacy: ['read'],
  },
  MEMBER: {
    members: ['read', 'update'],
    events: ['read'],
    waitlist: ['read', 'create'],
    bookings: ['read', 'create'],
    coaching: ['read'],
    compliance: ['read'],
    incidents: ['create'],
    privacy: ['read', 'create'],
  },
};

export function can(role: UserRole, resource: PermissionResource, action: PermissionAction): boolean {
  const resourcePermissions = permissionsByRole[role]?.[resource] || [];
  return resourcePermissions.includes(action);
}
