import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();
        const facilities = await prisma.facility.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(facilities);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const organizationId = await getCurrentOrganizationId();

        const facility = await prisma.facility.create({
            data: {
                name: data.name,
                description: data.description,
                capacity: data.capacity,
                baseRate: data.baseRate,
                memberRate: data.memberRate,
                isActive: data.isActive,
                organizationId
            },
        });

        return NextResponse.json(facility, { status: 201 });
    } catch (error) {
        console.error('Error creating facility', error);
        return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
        }

        const facility = await prisma.facility.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(facility);
    } catch (error) {
        console.error('Error updating facility', error);
        return NextResponse.json({ error: 'Failed to update facility' }, { status: 500 });
    }
}
