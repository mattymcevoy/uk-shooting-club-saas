import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'waitlist', action: 'approve' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { eventId, limit = 3 } = body;

  if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: context.user.organizationId },
    include: { _count: { select: { bookings: true } } },
  });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const capacityRemaining = Math.max((event.maxAttendees || 0) - event._count.bookings, 0);
  if (!event.maxAttendees || capacityRemaining <= 0) {
    return NextResponse.json({ promoted: 0, message: 'No capacity available for promotion' });
  }

  const candidates = await prisma.waitlistEntry.findMany({
    where: { eventId, organizationId: context.user.organizationId, status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
    take: Math.min(limit, capacityRemaining),
  });

  if (candidates.length === 0) {
    return NextResponse.json({ promoted: 0, message: 'No waiting entries to promote' });
  }

  const result = await prisma.$transaction(async (tx) => {
    for (const item of candidates) {
      await tx.waitlistEntry.update({
        where: { id: item.id },
        data: { status: 'OFFERED' },
      });
    }

    return { promotedIds: candidates.map(c => c.id) };
  });

  return NextResponse.json({ promoted: result.promotedIds.length, promotedIds: result.promotedIds });
}
