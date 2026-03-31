import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function POST(req: Request) {
  try {
    const { error, context } = await getRequestContext();
    if (error || !context) return error!;

    const { eventId, requestedTickets = 1 } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (requestedTickets < 1 || requestedTickets > 12) {
      return NextResponse.json({ error: 'requestedTickets must be between 1 and 12' }, { status: 400 });
    }

    const organizationId = context.user.organizationId;

    const user = await prisma.user.findFirst({
      where: { id: context.user.id, organizationId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const entry = await prisma.waitlistEntry.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: user.id
        }
      },
      create: {
        eventId: event.id,
        userId: user.id,
        organizationId,
        requestedTickets,
        status: 'WAITING'
      },
      update: {
        requestedTickets,
        status: 'WAITING'
      }
    });

    return NextResponse.json({ success: true, waitlist: entry }, { status: 201 });
  } catch (error: any) {
    console.error('Event Waitlist Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
