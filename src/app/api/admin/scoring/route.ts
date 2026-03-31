import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'analytics', action: 'read' } });
  if (error || !context) return error!;

  const scores = await prisma.disciplineScore.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(scores);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'events', action: 'update' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { userId, discipline, score, handicap, eventId, seasonId, notes } = body;

  if (!userId || !discipline || score === undefined) {
    return NextResponse.json({ error: 'userId, discipline and score are required' }, { status: 400 });
  }

  const created = await prisma.disciplineScore.create({
    data: {
      organizationId: context.user.organizationId,
      userId,
      discipline,
      score: Number(score),
      handicap: handicap !== undefined ? Number(handicap) : null,
      eventId: eventId || null,
      seasonId: seasonId || null,
      notes: notes || null,
    }
  });

  return NextResponse.json(created, { status: 201 });
}
