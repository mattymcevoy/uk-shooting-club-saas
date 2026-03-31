import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MembershipTier, AccountStatus } from '@prisma/client';
import { getRequestContext } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { error, context } = await getRequestContext({ requireAdmin: true });
        if (error || !context) return error!;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const user = await prisma.user.findFirst({
                where: { id, organizationId: context.user.organizationId },
                include: { subscriptions: true }
            });
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            return NextResponse.json(user);
        }

        const members = await prisma.user.findMany({
            where: { organizationId: context.user.organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
                subscriptions: {
                    select: { status: true, currentPeriodEnd: true }
                }
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { error, context } = await getRequestContext({ requireAdmin: true });
        if (error || !context) return error!;

        const body = await request.json();
        const { id, membershipTier, status, isLicenseHolder, isRegisteredShooter, name, phone } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { id, organizationId: context.user.organizationId },
            select: { id: true }
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                name,
                phone,
                membershipTier: membershipTier as MembershipTier,
                status: status as AccountStatus,
                isLicenseHolder: Boolean(isLicenseHolder),
                isRegisteredShooter: Boolean(isRegisteredShooter),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}
