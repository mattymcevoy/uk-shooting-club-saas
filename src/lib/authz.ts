import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { can, type PermissionAction, type PermissionResource } from '@/lib/rbac';

export type RequestContext = {
  user: {
    id: string;
    email: string | null;
    organizationId: string;
    role: 'MEMBER' | 'COACH' | 'RECEPTION' | 'ADMIN' | 'OWNER';
  };
};

type AuthzOptions = {
  requireAdmin?: boolean;
  permission?: {
    resource: PermissionResource;
    action: PermissionAction;
  };
};

export async function getRequestContext(options: AuthzOptions = {}): Promise<{ error?: NextResponse; context?: RequestContext }> {
  const { requireAdmin = false } = options;
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;

  if (!sessionUser?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findFirst({
    where: {
      email: sessionUser.email,
      ...(sessionUser.organizationId ? { organizationId: sessionUser.organizationId } : {}),
    },
    select: { id: true, email: true, organizationId: true, role: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  if (requireAdmin && !['ADMIN', 'OWNER'].includes(user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  if (options.permission && !can(user.role, options.permission.resource, options.permission.action)) {
    return { error: NextResponse.json({ error: 'Forbidden: insufficient permission' }, { status: 403 }) };
  }

  return {
    context: {
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
    },
  };
}
