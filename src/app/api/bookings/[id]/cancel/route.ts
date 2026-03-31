import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { autoPromoteWaitlist } from "@/lib/services/waitlists";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const bookingId = params.id;
        
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        // Ensure user actually owns this booking or is an admin
        if (booking.userId !== session.user.id && (session.user as any).role === "MEMBER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Mark booking cancelled and free up capacity
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" }
        });

        // 2. Automatically promote the next person waiting asynchronously
        if (updatedBooking.eventId) {
            // Trigger auto-promotion algorithm
            const promotionResult = await autoPromoteWaitlist(updatedBooking.eventId);
        }

        return NextResponse.json({ success: true, booking: updatedBooking }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
