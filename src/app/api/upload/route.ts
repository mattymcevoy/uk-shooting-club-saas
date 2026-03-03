import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                // Authenticate the user here in a real scenario
                // For now, we trust the payload indicating the user ID via clientPayload

                let userId: string;
                try {
                    const payloadData = JSON.parse(clientPayload || '{}');
                    userId = payloadData.userId;

                    if (!userId) {
                        throw new Error('User ID is required');
                    }
                } catch (e) {
                    throw new Error('Invalid client payload for upload');
                }

                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
                    tokenPayload: JSON.stringify({
                        userId
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Run after the upload finishes
                console.log('Upload completed', blob.url);

                try {
                    // You could parse the tokenPayload back out here to update your database
                    const { userId } = JSON.parse(tokenPayload || '{}');

                    if (!userId) return;

                    // Note: In actual usage, the client will get the blob URL and send it to an update API
                    // OR you can dynamically identify if it's a photo vs certificate based on path
                } catch (error) {
                    console.error('Could not parse tokenPayload or update DB:', error);
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 } // The webhook will retry 5 times waiting for a 200
        );
    }
}
