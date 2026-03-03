import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import crypto from 'crypto';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, email, phone, address, certificateNumber,
            membershipTier: planId, billingCycle, isGuest,
            profilePhotoUrl, certificateUrl
        } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        const organizationId = await getCurrentOrganizationId();

        // 0. Resolve Dynamic Memberships if not a Guest
        let plan = null;
        if (!isGuest && planId) {
            plan = await prisma.membershipPlan.findUnique({
                where: { id: planId }
            });
            if (!plan) {
                return NextResponse.json({ error: 'Selected membership tier is invalid' }, { status: 400 });
            }
        }

        // 1. Check if user already exists
        let user = await prisma.user.findFirst({
            where: {
                email,
                organizationId
            }
        });

        const qrHash = crypto.createHash('sha256').update(`${email}-${Date.now()}`).digest('hex');

        if (!user) {
            // Create brand new user
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    address,
                    certificateNumber,
                    membershipTier: 'GUEST', // Always start as GUEST until Stripe returns success
                    profilePhotoUrl,
                    certificateUrl,
                    qrHash,
                    status: 'ACTIVE',
                    organizationId
                }
            });
        } else {
            // Update existing user with new KYC data
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name,
                    phone,
                    address,
                    certificateNumber,
                    profilePhotoUrl: profilePhotoUrl || user.profilePhotoUrl,
                    certificateUrl: certificateUrl || user.certificateUrl,
                }
            });
        }

        // 2. If they checked the Guest box, skip Stripe completely and return to dashboard
        if (isGuest || !plan) {
            return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true&guest=true` }, { status: 200 });
        }

        // 3. Member path: Create Stripe Customer if one doesn't exist
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user.id,
                    organizationId
                }
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        // 4. Create Stripe Checkout Session
        const unitAmount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

        if (unitAmount > 0) {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer: customerId,
                line_items: [
                    {
                        price_data: {
                            currency: 'gbp',
                            product_data: {
                                name: `${plan.name} - ${billingCycle.toUpperCase()}`,
                            },
                            unit_amount: unitAmount,
                            recurring: {
                                interval: billingCycle === 'monthly' ? 'month' : 'year',
                            },
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join?canceled=true`,
                metadata: {
                    userId: user.id,
                    tierId: plan.id,
                    tierName: plan.name,
                    organizationId
                }
            });

            return NextResponse.json({ url: session.url }, { status: 200 });
        }

        // Free tier fallback
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
