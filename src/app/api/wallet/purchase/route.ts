import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Restore reliable Prisma ORM User validation capturing both generic
        // test members and dual admin sandbox mocks.
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

        const body = await req.json();
        const { type, id } = body;

        let costInPence = 0;
        let claysAmount = 0;
        let description = '';
        let orgTarget = '';
        let eventTargetId = null;
        let eventStartTarget = new Date();

        if (type === 'product') {
            const products: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Product" WHERE id = $1`, id);
            if (!products || products.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
            const product = products[0];
            
            costInPence = product.price;
            claysAmount = product.isDigital ? (product.claysAmount || 0) : 0;
            description = `Purchased: ${product.name}`;
            orgTarget = product.organizationId;
        } else if (type === 'event') {
            const events: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Event" WHERE id = $1`, id);
            if (!events || events.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });
            const event = events[0];
            
            costInPence = event.entryFee;
            description = `Booked Event: ${event.title}`;
            orgTarget = event.organizationId;
            eventTargetId = event.id;
            eventStartTarget = event.date || new Date();
        } else {
            return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 });
        }

        if (user.creditBalance < costInPence) {
            return NextResponse.json({ error: "Insufficient wallet funds. Please add funds first." }, { status: 400 });
        }

        await prisma.$executeRawUnsafe(`
            UPDATE "User" 
            SET "creditBalance" = "creditBalance" - $1, 
                "clayBalance" = "clayBalance" + $2
            WHERE id = $3
        `, costInPence, claysAmount || 0, user.id);

        if (eventTargetId) {
            const bookingId = "book_" + Date.now();
            const eventEndTarget = new Date(eventStartTarget.getTime() + 2 * 60 * 60 * 1000);
            
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Booking" ("id", "userId", "organizationId", "eventId", "startTime", "endTime", "status", "amountPaid", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, bookingId, user.id, orgTarget, eventTargetId, eventStartTarget, eventEndTarget, "CONFIRMED", costInPence);
        }

        // Sandbox/Testing: Create a Transaction row to act as a receipt
        await prisma.walletTransaction.create({
            data: {
                userId: user.id,
                type: 'USAGE',
                amount: -costInPence, // Recorded natively as a negative/deduction
                description
            }
        });

        return NextResponse.json({ success: true, claysAdded: claysAmount, deducted: costInPence });

    } catch (error: any) {
        console.error('Wallet Purchase Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
