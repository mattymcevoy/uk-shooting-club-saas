import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, description } = body; // amount in pennies, e.g. 5000 = £50.00

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: "Invalid top-up amount" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: session.user.email || undefined },
                    { id: (session.user as any).id || undefined }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // TESTING / SANDBOX MODE: Bypass Stripe Provider entirely
        // Immediately credit the user's wallet with the requested amount
        
        await prisma.user.update({
            where: { id: user.id },
            data: { creditBalance: { increment: amount } }
        });

        await prisma.walletTransaction.create({
            data: {
                userId: user.id,
                type: 'DEPOSIT',
                amount: amount,
                description: `E-Wallet Funding (Sandbox): £${(amount / 100).toFixed(2)}`
            }
        });

        // Officially log this top-up as a PAID Invoice so it registers correctly in the
        // Admin Financial Overview for 'Total Revenue' & 'Recent Invoices'
        await prisma.invoice.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId,
                amount: amount,
                status: 'PAID',
                description: 'E-Wallet Funds Top-Up (Sandbox)'
            }
        });

        // Return the dashboard success URL just as Stripe would
        const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?wallet=success`;
        return NextResponse.json({ url: redirectUrl });

    } catch (error: any) {
        console.error('Wallet Top-up Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
