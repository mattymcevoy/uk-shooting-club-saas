import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();

        const events = await prisma.event.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: { bookings: true, squads: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const body = await req.json();
        const { title, description, date, signInTime, startTime, maxAttendees, eventType, entryFee, squadCount, maxPerSquad } = body;

        if (!title || !date) {
            return NextResponse.json({ error: 'Title and Date are required' }, { status: 400 });
        }

        const parseTime = (dateStr: string, timeStr: string | null) => {
            if (!timeStr) return null;
            return new Date(`${dateStr}T${timeStr}:00`);
        };

        const event = await prisma.event.create({
            data: {
                organizationId,
                title,
                description,
                date: new Date(date),
                signInTime: parseTime(date, signInTime),
                startTime: parseTime(date, startTime),
                maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                eventType: eventType || 'COMPETITION',
                entryFee: entryFee ? parseInt(entryFee) : 0,
                squads: {
                    create: Array.from({ length: squadCount ? parseInt(squadCount) : 1 }).map((_, i) => ({
                        name: `Squad ${i + 1}`,
                        maxCapacity: maxPerSquad ? parseInt(maxPerSquad) : 6
                    }))
                }
            }
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, description, date, signInTime, startTime, maxAttendees, eventType, entryFee, squadCount, maxPerSquad } = body;

        if (!id) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const parseTime = (dateStr: string, timeStr: string | null) => {
            if (!timeStr) return null;
            // If dateStr exists, use it. Otherwise, default to today's date so we don't crash.
            // (Ideally, the frontend would pass the original date if not modified, but we handle it safely)
            const baseDate = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
            return new Date(`${baseDate}T${timeStr}:00`);
        };

        const existingEvent = await prisma.event.findUnique({
            where: { id },
            include: { _count: { select: { squads: true } } }
        });

        if (!existingEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                signInTime: signInTime !== undefined ? parseTime(date, signInTime) : undefined,
                startTime: startTime !== undefined ? parseTime(date, startTime) : undefined,
                maxAttendees: maxAttendees !== undefined ? (maxAttendees ? parseInt(maxAttendees) : null) : undefined,
                eventType,
                entryFee: entryFee !== undefined ? parseInt(entryFee) : undefined,
            }
        });

        const currentSquadCount = existingEvent._count.squads;
        const targetSquadCount = squadCount ? parseInt(squadCount) : 1;

        if (targetSquadCount > currentSquadCount) {
            await prisma.squad.createMany({
                data: Array.from({ length: targetSquadCount - currentSquadCount }).map((_, i) => ({
                    eventId: id,
                    name: `Squad ${currentSquadCount + i + 1}`,
                    maxCapacity: maxPerSquad ? parseInt(maxPerSquad) : 6
                }))
            });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        await prisma.event.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
