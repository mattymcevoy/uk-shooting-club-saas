import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || '';

const handleSubscriptionEvent = async (event: Stripe.Event) => {
    // In a real application, you'd use a Prisma client to update the user's subscription record here
    // based on the event context, for example:
    // - invoice.payment_succeeded -> update subscription to ACTIVE
    // - customer.subscription.deleted -> update to CANCELED
    console.log(`Unhandled relevant event! ${event.type}`);
};

export async function POST(req: Request) {
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
