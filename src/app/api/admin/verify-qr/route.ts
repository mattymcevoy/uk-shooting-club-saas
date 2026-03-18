import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Fallback to checking the `qrHash` against the User if the payload is raw text
        // Or unpack the JSON payload from the dashboard
        let qrHashToSearch = '';

        try {
            const parsed = JSON.parse(body.qrHash || '{}');
            qrHashToSearch = parsed.qrHash || body.qrHash;
        } catch {
            qrHashToSearch = body.qrHash;
        }

        if (!qrHashToSearch) {
            return NextResponse.json({ error: 'QR Hash is required' }, { status: 400 });
        }

        // 1. Find the User by their permanent `qrHash`
        const user = await prisma.user.findUnique({
            where: { qrHash: qrHashToSearch },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid QR Code. No member found.' }, { status: 404 });
        }

        // 2. Define the 48-hour window (+/- 24 hours around now)
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // 3. Find active bookings for this user within the time window
        const recentBookings = await prisma.booking.findMany({
            where: {
                userId: user.id,
                startTime: {
                    gte: twoDaysAgo,
                    lte: twoDaysFromNow,
                }
            },
            include: {
                facility: { select: { name: true } },
                event: { select: { title: true } },
                squad: { select: { name: true } }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                membershipTier: user.membershipTier,
                isLicenseHolder: user.isLicenseHolder,
                profilePhotoUrl: user.profilePhotoUrl,
                status: user.status,
                creditBalance: user.creditBalance,
            },
            itinerary: recentBookings.map(b => ({
                id: b.id,
                facilityName: b.facility?.name || 'General Facility',
                eventName: b.event?.title,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                squadNumber: b.squad?.name || null,
                prePaidClays: b.prePaidClays,
                prePaidLessons: b.prePaidLessons,
                checkedInAt: b.checkedInAt,
            }))
        });

    } catch (error) {
        console.error('Verify QR API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
