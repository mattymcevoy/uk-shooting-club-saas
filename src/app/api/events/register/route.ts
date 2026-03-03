import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { eventId, name, email, phone } = body;

        if (!eventId || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const organizationId = await getCurrentOrganizationId();

        // 1. Verify Event Exists and belongs to Tenant
        const event = await prisma.event.findFirst({
            where: { id: eventId, organizationId }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // 2. Find or Create the Lead (User with GUEST tier) in this CRM
        let user = await prisma.user.findFirst({
            where: { email, organizationId }
        });

        if (!user) {
            // Generate QR Hash for the Guest Lead
            const qrHash = crypto.createHash('sha256').update(`${email}-${Date.now()}`).digest('hex');

            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    organizationId,
                    membershipTier: 'GUEST',
                    status: 'ACTIVE',
                    qrHash
                }
            });
        } else if (!user.phone && phone) {
            // Update phone if they provided one now
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phone }
            });
        }

        // Note: For a complete system, we would create a `Booking` record pointing to the `Event`
        // However, the current schema `Booking` points strictly to `Facility`.
        // We will just return success as the Lead has been captured in the CRM.

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 });
    }
}
