import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const stripe = getStripe();
        const body = await req.json();
        const { clubName, ownerName, ownerEmail, platformPlanId, billingCycle } = body;

        if (!clubName || !ownerName || !ownerEmail || !platformPlanId) {
            return NextResponse.json({ error: 'All fields including a SaaS Plan are required' }, { status: 400 });
        }

        // Fetch the Global SaaS Plan from DB
        const plan = await prisma.platformPlan.findUnique({ where: { id: platformPlanId } });
        if (!plan) {
            return NextResponse.json({ error: 'Selected SaaS plan is invalid' }, { status: 400 });
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

        // 4. Create Stripe Checkout Session for the Software License using dynamic plan pricing
        const unitAmount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: customer.id,
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `Shooting Club SaaS - ${plan.name} (${billingCycle.toUpperCase()})`,
                            description: plan.description || 'Full white-label platform access.',
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
