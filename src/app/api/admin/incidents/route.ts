import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'incidents', action: 'read' } });
  if (error || !context) return error!;

  const incidents = await prisma.incidentLog.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { occurredAt: 'desc' },
  });

  return NextResponse.json(incidents);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'incidents', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { title, severity, category, details, occurredAt } = body;
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const created = await prisma.incidentLog.create({
    data: {
      organizationId: context.user.organizationId,
      title,
      severity: severity || 'LOW',
      category: category || 'SAFETY',
      details: details || null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      reportedById: context.user.id,
    }
  });

  return NextResponse.json(created, { status: 201 });
}
