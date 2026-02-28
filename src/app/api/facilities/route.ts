export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const facilities = await prisma.facility.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(facilities);
    } catch (error) {
        console.error('Failed to fetch facilities:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, capacity, baseRate, memberRate, isActive } = body;

        if (!name || typeof capacity !== 'number') {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const newFacility = await prisma.facility.create({
            data: {
                name,
                description,
                capacity,
                baseRate,
                memberRate,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(newFacility, { status: 201 });
    } catch (error) {
        console.error('Failed to create facility:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
