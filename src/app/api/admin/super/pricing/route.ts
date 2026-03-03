import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const plans = await prisma.platformPlan.findMany({
            where: { isActive: true },
            orderBy: { monthlyPrice: 'asc' }
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching platform plans:', error);
        return NextResponse.json({ error: 'Failed to fetch platform plans' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name, description, monthlyPrice, annualPrice } = data;

        if (!name || !monthlyPrice || !annualPrice) {
            return NextResponse.json({ error: 'Name, monthly price, and annual price are required' }, { status: 400 });
        }

        const newPlan = await prisma.platformPlan.create({
            data: {
                name,
                description,
                monthlyPrice: parseInt(monthlyPrice) * 100, // Convert £ to pence
                annualPrice: parseInt(annualPrice) * 100    // Convert £ to pence
            }
        });

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        console.error('Error creating platform plan:', error);
        return NextResponse.json({ error: 'Failed to create platform plan' }, { status: 500 });
    }
}
