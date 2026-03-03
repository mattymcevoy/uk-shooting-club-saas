import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();
        const events = await prisma.event.findMany({
            where: { organizationId },
            orderBy: { date: 'asc' }
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { title, description, date, maxAttendees } = data;
        const organizationId = await getCurrentOrganizationId();

        if (!title || !date) {
            return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
        }

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                organizationId
            }
        });

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
