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
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Use existing Stripe Customer ID if they have one from previous memberships
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email || undefined,
                name: user.name || "Member",
                metadata: {
                    userId: user.id
                }
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        const claysAmount = Math.floor(amount / 35); // Example calculation: 35p per clay

        // Create Stripe Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer: customerId,
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `Digital Wallet Top-up`,
                            description: `Adds £${(amount / 100).toFixed(2)} to your account balance (approx ${claysAmount} clays).`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?wallet=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?wallet=canceled`,
            metadata: {
                type: 'WALLET_TOPUP',
                userId: user.id,
                amount: amount.toString(),
            }
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error: any) {
        console.error('Wallet Top-up Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
