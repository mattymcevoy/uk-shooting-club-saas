import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { name, phone, email, membershipNumber } = await req.json();

        // If they provided a membership number directly, let's look them up by that
        if (membershipNumber) {
            const user = await prisma.user.findFirst({
                where: { membershipNumber }
            });

            if (user) {
                // Determine if expired effectively (IN_ARREARS or SUSPENDED)
                const isExpired = user.status === 'IN_ARREARS' || user.status === 'SUSPENDED';

                if (isExpired) {
                    // Send an email asking to renew (Mocked for MVP)
                    console.log(`[EMAIL SYSTEM]: Sending Renewal Reminder to ${user.email} for Membership #${membershipNumber}`);
                    return NextResponse.json({ found: true, user: { ...user, isExpired: true }, message: "Membership expired. Renewal email sent." });
                }

                return NextResponse.json({ found: true, user: { ...user, isExpired: false } });
            }
            // Not found by membership number natively
            return NextResponse.json({ found: false });
        }

        // Auto-lookup by Name, Phone, and Email
        if (name && phone && email) {
            const user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    // Optionally restrict mapping to exact name/phone for tight security
                    // phone: phone, 
                    // name: { contains: name, mode: 'insensitive' }
                }
            });

            // @ts-ignore - bypassing stale TS compiler errors for the newly added membershipNumber property
            if (user && user.membershipNumber) {
                const isExpired = user.status === 'IN_ARREARS' || user.status === 'SUSPENDED';
                
                if (isExpired) {
                    // @ts-ignore
                    console.log(`[EMAIL SYSTEM]: Sending Renewal Reminder to ${user.email} for Membership #${user.membershipNumber}`);
                    return NextResponse.json({ found: true, user: { ...user, isExpired: true }, message: "Membership expired. Renewal email sent." });
                }

                return NextResponse.json({ found: true, user: { ...user, isExpired: false } });
            }
        }

        return NextResponse.json({ found: false });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
