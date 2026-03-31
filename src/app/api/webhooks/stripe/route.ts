import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendEmail, WalletTopUpEmail } from '@/lib/emails/mailer';

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || '';

const handleSubscriptionEvent = async (event: Stripe.Event) => {

    // 1. Handle Wallet Top-ups
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === 'WALLET_TOPUP') {
            const userId = session.metadata.userId;
            const amountStr = session.metadata.amount;

            if (userId && amountStr) {
                const amount = parseInt(amountStr, 10);

                // Idempotency check: Ensure we haven't already processed this payment intent
                const existingTx = await prisma.walletTransaction.findUnique({
                    where: { stripePaymentIntentId: session.payment_intent as string }
                });

                if (!existingTx) {
                    await prisma.$transaction(async (tx) => {
                        // Create Ledger Entry
                        await tx.walletTransaction.create({
                            data: {
                                userId,
                                type: 'DEPOSIT',
                                amount,
                                description: `Wallet Top-up via Stripe`,
                                stripePaymentIntentId: session.payment_intent as string
                            }
                        });

                        // Update Balance
                        const updatedUser = await tx.user.update({
                            where: { id: userId },
                            data: {
                                creditBalance: {
                                    increment: amount
                                }
                            }
                        });

                        // Fire out an Automated Email Receipt
                        await sendEmail({
                            to: updatedUser.email!,
                            subject: `Digital Wallet Credited: £${(amount / 100).toFixed(2)}`,
                            react: WalletTopUpEmail({
                                name: updatedUser.name || 'Member',
                                amountStr: `£${(amount / 100).toFixed(2)}`,
                                newBalanceStr: `£${(updatedUser.creditBalance / 100).toFixed(2)}`
                            })
                        });
                    });
                    console.log(`[Stripe Webhook] Successfully credited £${(amount / 100).toFixed(2)} to user ${userId}`);
                }
                return; // Early return to prevent falling into subscription logic
            }
        }
    }

    // 2. Handle Subscriptions (Stub)
    console.log(`Unhandled relevant event! ${event.type}`);
};

export async function POST(req: Request) {
    if (!isStripeConfigured()) {
        return new NextResponse('Stripe is not configured on this deployment.', { status: 503 });
    }

    const stripe = getStripe();
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const relevantEvents = new Set([
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
    ]);

    if (relevantEvents.has(event.type)) {
        try {
            await handleSubscriptionEvent(event);
        } catch (error) {
            console.error(`Handler error:`, error);
            return new NextResponse('Webhook handler failed. View logs.', { status: 400 });
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
