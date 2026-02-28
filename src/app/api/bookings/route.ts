export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facilityId');
    const dateStr = searchParams.get('date');

    try {
        const whereClause: any = {
            status: { in: ['CONFIRMED', 'ATTENDED', 'PENDING'] },
        };

        if (facilityId) whereClause.facilityId = facilityId;

        if (dateStr) {
            const startOfDay = new Date(dateStr);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(dateStr);
            endOfDay.setUTCHours(23, 59, 59, 999);

            whereClause.startTime = {
                gte: startOfDay,
                lt: endOfDay,
            };
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: { facility: true, user: { select: { id: true, name: true } } },
            orderBy: { startTime: 'asc' },
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Failed to fetch bookings', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, facilityId, startTime, endTime } = body;

        if (!userId || !facilityId || !startTime || !endTime) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return new NextResponse('End time must be after start time', { status: 400 });
        }

        // Step 1: Fetch Facility
        const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facility) {
            return new NextResponse('Facility not found', { status: 404 });
        }
        if (!facility.isActive) {
            return new NextResponse('Facility is currently inactive', { status: 400 });
        }

        // Step 2: Fetch User to check membership (simulate a discount logic)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Capacity limitation checks: how many bookings overlap with this timeframe
        const overlappingBookings = await prisma.booking.count({
            where: {
                facilityId,
                status: { in: ['CONFIRMED', 'PENDING'] },
                OR: [
                    { startTime: { lt: end }, endTime: { gt: start } }
                ]
            },
        });

        if (overlappingBookings >= facility.capacity) {
            return new NextResponse('Facility capacity reached for this timeframe', { status: 409 });
        }

        // Calculate cost based on Membership
        const rate = user.membershipTier === 'FULL_MEMBER' || user.membershipTier === 'VIP'
            ? facility.memberRate
            : facility.baseRate;

        // Optional: Only create payment intent if rate > 0
        let paymentIntentId = null;
        let clientSecret = null;
        if (rate > 0) {
            const intent = await stripe.paymentIntents.create({
                amount: rate,
                currency: 'gbp',
                metadata: { userId, facilityId, type: 'BOOKING' },
            });
            paymentIntentId = intent.id;
            clientSecret = intent.client_secret;
        }

        // Create the pending booking record
        const newBooking = await prisma.booking.create({
            data: {
                userId,
                facilityId,
                startTime: start,
                endTime: end,
                amountPaid: rate, // Usually we verify after webhook, but assume pending rate
                paymentIntentId,
                status: rate === 0 ? 'CONFIRMED' : 'PENDING'
            },
        });

        return NextResponse.json({ booking: newBooking, clientSecret }, { status: 201 });
    } catch (error) {
        console.error('Failed to create booking', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
