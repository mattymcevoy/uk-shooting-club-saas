import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: bookingId } = await params;
        const organizationId = await getCurrentOrganizationId();

        const body = await req.json();
        const { attendeeName, startStand } = body;

        // Verify the booking belongs to this organization before updating
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking || booking.organizationId !== organizationId) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                attendeeName: attendeeName || null,
                startStand: startStand || null
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
