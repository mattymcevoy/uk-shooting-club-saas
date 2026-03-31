import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'compliance', action: 'read' } });
  if (error || !context) return error!;

  const docs = await prisma.complianceDocument.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'compliance', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { userId, type, reference, expiresAt } = body;
  if (!userId || !type) return NextResponse.json({ error: 'userId and type are required' }, { status: 400 });

  const created = await prisma.complianceDocument.create({
    data: {
      organizationId: context.user.organizationId,
      userId,
      type,
      reference: reference || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: 'PENDING',
    }
  });

  return NextResponse.json(created, { status: 201 });
}
