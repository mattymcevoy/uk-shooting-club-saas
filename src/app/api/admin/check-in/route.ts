import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function POST(req: Request) {
    try {
        const { error, context } = await getRequestContext({ requireAdmin: true });
        if (error || !context) return error!;

        const body = await req.json();
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const bookingRecord = await prisma.booking.findFirst({
            where: { id: bookingId, organizationId: context.user.organizationId },
            select: { id: true }
        });

        if (!bookingRecord) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = await prisma.booking.update({
            where: { id: bookingRecord.id },
            data: {
                status: 'ATTENDED',
                checkedInAt: new Date(),
            }
        });

        return NextResponse.json({ success: true, booking });

    } catch (error) {
        console.error('Check-in API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
