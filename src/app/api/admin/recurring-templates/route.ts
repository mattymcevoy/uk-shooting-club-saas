import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'bookings', action: 'read' } });
  if (error || !context) return error!;

  const templates = await prisma.recurringBookingTemplate.findMany({
    where: { organizationId: context.user.organizationId },
    include: { facility: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'bookings', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { facilityId, title, weekday, startHour, durationMinutes, maxOccurrences } = body;

  if (!facilityId || !title || weekday === undefined || startHour === undefined || !durationMinutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const created = await prisma.recurringBookingTemplate.create({
    data: {
      organizationId: context.user.organizationId,
      ownerId: context.user.id,
      facilityId,
      title,
      weekday: Number(weekday),
      startHour: Number(startHour),
      durationMinutes: Number(durationMinutes),
      maxOccurrences: maxOccurrences ? Number(maxOccurrences) : null,
    }
  });

  return NextResponse.json(created, { status: 201 });
}
