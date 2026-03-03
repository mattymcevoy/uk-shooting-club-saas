import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        return NextResponse.json(org);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const organizationId = await getCurrentOrganizationId();
        const data = await req.json();

        // Prevent modifying sensitive SaaS billing fields
        const { id, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, ...updateData } = data;

        const updatedOrg = await prisma.organization.update({
            where: { id: organizationId },
            data: updateData
        });

        return NextResponse.json(updatedOrg);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
