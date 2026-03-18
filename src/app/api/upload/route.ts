import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const action = formData.get('action') as string;
        const uploadType = formData.get('type') as string; // 'certificate' or 'photo'
        const file = formData.get('file') as File | null;

        if (!['certificate', 'photo'].includes(uploadType)) {
            return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
        }

        const dbField = uploadType === 'certificate' ? 'certificateUrl' : 'profilePhotoUrl';

        if (action === 'delete') {
            const currentUrl = user[dbField as keyof typeof user] as string | null;
            if (currentUrl) {
                try {
                    await del(currentUrl);
                } catch (e) {
                    console.error("Failed to delete from blob storage:", e);
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    [dbField]: null,
                },
            });

            return NextResponse.json({ success: true, user: updatedUser });
        }

        if (action === 'upload') {
            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
            }

            const filename = `${user.id}-${uploadType}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            const blob = await put(filename, file, {
                access: 'public',
            });

            const currentUrl = user[dbField as keyof typeof user] as string | null;
            if (currentUrl) {
                try {
                    await del(currentUrl);
                } catch (e) {
                    console.error("Failed to delete old remote blob:", e);
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    [dbField]: blob.url,
                },
            });

            return NextResponse.json({ success: true, url: blob.url, user: updatedUser });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Blob Operation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
