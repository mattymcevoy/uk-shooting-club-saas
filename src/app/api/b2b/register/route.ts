import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clubName, ownerName, ownerEmail, billingCycle } = body;

        if (!clubName || !ownerName || !ownerEmail) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // 1. Create the B2B Organization (Tenant)
        const organization = await prisma.organization.create({
            data: {
                name: clubName,
                subscriptionStatus: 'TRIALING', // Upgraded to ACTIVE upon successful Stripe webhook
            }
        });

        // 2. Create the Owner Admin User within that organization
        const owner = await prisma.user.create({
            data: {
                name: ownerName,
                email: ownerEmail,
                organizationId: organization.id,
                membershipTier: 'FULL_MEMBER',
                status: 'ACTIVE'
            }
        });

        // 3. Create Stripe Customer representing the B2B Organization
        const customer = await stripe.customers.create({
            email: ownerEmail,
            name: clubName,
            metadata: {
                organizationId: organization.id,
                ownerId: owner.id,
                isB2B: 'true'
            }
        });

        // Update organization with Stripe reference
        await prisma.organization.update({
            where: { id: organization.id },
            data: { stripeCustomerId: customer.id }
        });

        // 4. Create Stripe Checkout Session for the Software License
        const unitAmount = billingCycle === 'monthly' ? 19900 : 190000; // £199/mo or £1900/yr

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: customer.id,
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `Shooting Club SaaS Platform - ${billingCycle.toUpperCase()} License`,
                            description: 'Full white-label platform access with automated bookings, digital QR cards, and CRM.',
                        },
                        unit_amount: unitAmount,
                        recurring: {
                            interval: billingCycle === 'monthly' ? 'month' : 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            // Redirect admin to their new dashboard after payment
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/dashboard?b2b_welcome=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/b2b/register?canceled=true`,
            metadata: {
                organizationId: organization.id,
                type: 'B2B_LICENSE'
            }
        });

        return NextResponse.json({ url: session.url }, { status: 200 });

    } catch (error: any) {
        console.error('B2B Server Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
