import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'coaching', action: 'read' } });
  if (error || !context) return error!;

  const sessions = await prisma.coachingSession.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { scheduledAt: 'desc' }
  });

  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'coaching', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { memberId, coachId, packageId, scheduledAt, durationMinutes } = body;

  if (!memberId || !scheduledAt || !durationMinutes) {
    return NextResponse.json({ error: 'memberId, scheduledAt, and durationMinutes are required' }, { status: 400 });
  }

  const created = await prisma.coachingSession.create({
    data: {
      organizationId: context.user.organizationId,
      memberId,
      coachId: coachId || null,
      packageId: packageId || null,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes),
      status: 'SCHEDULED',
    }
  });

  return NextResponse.json(created, { status: 201 });
}
