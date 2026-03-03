import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AccountStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, qrHash, bookingId, userId } = body;

        if (!type || !qrHash) {
            return NextResponse.json({ error: 'Invalid QR Payload format' }, { status: 400 });
        }

        // 1. Memberships Verification
        if (type === 'MEMBERSHIP_VERIFICATION' && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId, qrHash }
            });

            if (!user) {
                return NextResponse.json({ error: 'Membership Verification Failed' }, { status: 404 });
            }

            // Return strictly what the scanner app needs
            return NextResponse.json({
                record: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    status: user.status as AccountStatus,
                    membershipTier: user.membershipTier,
                    isLicenseHolder: user.isLicenseHolder,
                    isRegisteredShooter: user.isRegisteredShooter,
                    profilePhotoUrl: user.profilePhotoUrl
                }
            }, { status: 200 });
        }

        // 2. Booking Verification
        if (type === 'BOOKING_VERIFICATION' && bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId, qrHash },
                include: {
                    user: { select: { name: true, phone: true, isLicenseHolder: true } },
                    facility: { select: { name: true, isActive: true } }
                }
            });

            if (!booking) {
                return NextResponse.json({ error: 'Booking Verification Failed' }, { status: 404 });
            }

            // Optional Check: Is the booking for today?
            const now = new Date();
            const bookingDate = new Date(booking.startTime);
            const isToday = bookingDate.setHours(0, 0, 0, 0) === new Date(now).setHours(0, 0, 0, 0);

            if (!isToday) {
                return NextResponse.json({ error: `Warning: Booking is scheduled for ${new Date(booking.startTime).toLocaleDateString()}` }, { status: 400 });
            }

            return NextResponse.json({
                record: {
                    id: booking.id,
                    status: booking.status,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    user: booking.user,
                    facility: booking.facility
                }
            }, { status: 200 });
        }

        return NextResponse.json({ error: 'Unknown QR Type' }, { status: 400 });

    } catch (error) {
        console.error('QR Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
