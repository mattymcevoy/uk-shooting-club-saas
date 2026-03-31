import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'privacy', action: 'read' } });
  if (error || !context) return error!;

  const requests = await prisma.privacyRequest.findMany({
    where: {
      organizationId: context.user.organizationId,
      ...(context.user.role === 'MEMBER' ? { userId: context.user.id } : {})
    },
    orderBy: { requestedAt: 'desc' }
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'privacy', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { requestType, notes } = body;

  if (!requestType || !['ACCESS_EXPORT', 'ERASURE', 'RECTIFICATION'].includes(requestType)) {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  }

  const created = await prisma.privacyRequest.create({
    data: {
      organizationId: context.user.organizationId,
      userId: context.user.id,
      requestType,
      notes: notes || null,
      status: 'OPEN',
    }
  });

  return NextResponse.json(created, { status: 201 });
}
