import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();

        const plans = await prisma.membershipPlan.findMany({
            where: { organizationId, isActive: true },
            orderBy: { monthlyPrice: 'asc' }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching membership plans:', error);
        return NextResponse.json({ error: 'Failed to fetch membership plans' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const organizationId = await getCurrentOrganizationId();
        const data = await req.json();

        const { name, description, monthlyPrice, annualPrice } = data;

        if (!name || !monthlyPrice || !annualPrice) {
            return NextResponse.json({ error: 'Name, monthly price, and annual price are required' }, { status: 400 });
        }

        const newPlan = await prisma.membershipPlan.create({
            data: {
                name,
                description,
                monthlyPrice: parseInt(monthlyPrice) * 100, // Convert £ to pence
                annualPrice: parseInt(annualPrice) * 100,   // Convert £ to pence
                organizationId
            }
        });

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        console.error('Error creating membership plan:', error);
        return NextResponse.json({ error: 'Failed to create membership plan' }, { status: 500 });
    }
}
