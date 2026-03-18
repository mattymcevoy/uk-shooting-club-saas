import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const { id: eventId } = await params;

        const event = await prisma.event.findFirst({
            where: { id: eventId, organizationId },
            include: { squads: true }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const bookings = await prisma.booking.findMany({
            where: { eventId, organizationId, status: { not: 'CANCELLED' } },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        membershipTier: true,
                        qrHash: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ event, bookings });
    } catch (error) {
        console.error('Error fetching squads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const { id: eventId } = await params;
        const body = await req.json();
        const { bookingId, squadId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // Verify Event
        const event = await prisma.event.findFirst({
            where: { id: eventId, organizationId },
            include: { squads: true }
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Optional bounds checking
        if (squadId) {
            const squad = event.squads.find((s: any) => s.id === squadId);
            if (!squad) {
                return NextResponse.json({ error: 'Squad not found' }, { status: 400 });
            }

            // Check capacity
            const currentSquadOccupancy = await prisma.booking.count({
                where: { eventId, squadId, status: { not: 'CANCELLED' } }
            });

            // If we are moving them INTO this squad, check if it's full. 
            const targetBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (targetBooking?.squadId !== squadId && currentSquadOccupancy >= squad.maxCapacity) {
                return NextResponse.json({ error: `Squad ${squad.name} is full (${squad.maxCapacity}/${squad.maxCapacity})` }, { status: 400 });
            }
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId, organizationId },
            data: {
                squadId: squadId || null
            }
        });

        return NextResponse.json(updatedBooking);
    } catch (error) {
        console.error('Error updating squad:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
