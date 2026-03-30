import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const organizationId = await getCurrentOrganizationId();
        const plans = await prisma.membershipPlan.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const organizationId = await getCurrentOrganizationId();
        
        // Mocking Stripe integration for the MVP (this allows local testing without a live Stripe key)
        const mockedStripeMonthlyId = `price_mock_${Math.random().toString(36).substring(7)}`;
        const mockedStripeAnnualId = `price_mock_${Math.random().toString(36).substring(7)}`;

        const newPlan = await prisma.membershipPlan.create({
            data: {
                organizationId,
                name: body.name,
                description: body.description,
                monthlyPrice: Number(body.monthlyPrice),
                annualPrice: Number(body.annualPrice),
                stripeMonthlyPriceId: mockedStripeMonthlyId,
                stripeAnnualPriceId: mockedStripeAnnualId,
                isActive: body.isActive ?? true,
            }
        });

        return NextResponse.json(newPlan);
    } catch (error) {
        console.error('Create plan error:', error);
        return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }
}
