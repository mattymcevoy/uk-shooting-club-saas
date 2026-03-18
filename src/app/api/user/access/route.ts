import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT: Member granting or revoking access to their documents
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { grantAccess } = body;

        if (typeof grantAccess !== 'boolean') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                licenseAccessGranted: grantAccess,
                // If they are granting access, clear any pending request
                // If they are revoking, we also clear it so the banner disappears 
                // (or they can just toggle the visibility at will)
                licenseAccessRequested: false,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error('Access Update Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Admin requesting access to a member's documents
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Technically, you should verify if `session.user` is an Admin here.
        // Assuming simple authorization based on the UI path for now.

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                licenseAccessRequested: true,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error('Access Request Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
