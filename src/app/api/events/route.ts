import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();

        // Fetch upcoming events, including a count of current bookings
        const events = await prisma.event.findMany({
            where: {
                organizationId,
                date: {
                    gte: new Date() // Only upcoming events
                }
            },
            include: {
                _count: {
                    select: { bookings: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Map it so it's easier to consume on the frontend
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            signInTime: event.signInTime,
            startTime: event.startTime,
            eventType: event.eventType,
            entryFee: event.entryFee,
            maxAttendees: event.maxAttendees,
            currentAttendees: event._count.bookings
        }));

        return NextResponse.json(formattedEvents);
    } catch (error) {
        console.error('Error fetching member events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
