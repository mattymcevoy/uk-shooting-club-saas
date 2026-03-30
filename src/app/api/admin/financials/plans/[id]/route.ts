import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function PUT(
    request: Request,
    // Context mapping required for Next.js app directory route handlers dynamic params
    context: { params: { id: string } }
) {
    try {
        // Access params correctly without triggering asynchronous destructuring warning on Next 15+
        const { id } = await Promise.resolve(context.params);
        const body = await request.json();
        const organizationId = await getCurrentOrganizationId();

        const updatedPlan = await prisma.membershipPlan.update({
            where: { id, organizationId },
            data: {
                name: body.name,
                description: body.description,
                monthlyPrice: Number(body.monthlyPrice),
                annualPrice: Number(body.annualPrice),
                isActive: body.isActive ?? true,
            }
        });

        return NextResponse.json(updatedPlan);
    } catch (error) {
        console.error('Update plan error:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const organizationId = await getCurrentOrganizationId();

        // Delete the plan
        await prisma.membershipPlan.delete({
            where: { id, organizationId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete plan error:', error);
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }
}
