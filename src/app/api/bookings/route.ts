import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, phone, facilityId, startTime, endTime, attendeeName } = body;

        if (!email || !facilityId || !startTime || !endTime || !attendeeName) {
            return NextResponse.json({ error: 'Missing required booking fields (Name, Email, Facility, Date or Time)' }, { status: 400 });
        }

        const organizationId = await getCurrentOrganizationId();
        
        // 1. Resolve or Create the Guest User for the Schema Constraint
        let user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: attendeeName,
                    phone: phone || null,
                    organizationId,
                    membershipTier: 'GUEST',
                    status: 'ACTIVE'
                }
            });
        }

        const userId = user.id;
        const qrHash = crypto.createHash('sha256').update(`${userId}-${startTime}-${Date.now()}`).digest('hex');

        const booking = await prisma.booking.create({
            data: {
                userId,
                facilityId,
                organizationId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                attendeeName,
                status: 'CONFIRMED',
                qrHash
            }
        });

        return NextResponse.json({ success: true, booking }, { status: 200 });

    } catch (error: any) {
        console.error('Booking API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
