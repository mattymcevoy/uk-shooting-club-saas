import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; squadId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const { id: eventId, squadId } = await params;
        const body = await req.json();
        const { name, maxCapacity, startTime } = body;

        // Verify Event belongs to Org
        const event = await prisma.event.findFirst({
            where: { id: eventId, organizationId }
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Verify Squad belongs to Event
        const squad = await prisma.squad.findFirst({
            where: { id: squadId, eventId }
        });

        if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });

        const parseTime = (dateStr: string, timeStr: string | null) => {
            if (!timeStr) return null;
            const baseDate = dateStr.split('T')[0];
            return new Date(`${baseDate}T${timeStr}:00`);
        };

        const updatedSquad = await prisma.squad.update({
            where: { id: squadId },
            data: {
                name: name !== undefined ? name : undefined,
                maxCapacity: maxCapacity !== undefined ? parseInt(maxCapacity) : undefined,
                startTime: startTime !== undefined ? parseTime(event.date.toISOString(), startTime) : undefined
            }
        });

        return NextResponse.json(updatedSquad);
    } catch (error) {
        console.error('Error updating squad configuration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
