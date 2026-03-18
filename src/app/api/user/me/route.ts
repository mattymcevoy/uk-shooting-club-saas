import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: session.user.email,
                // If using same email across tenants, NextAuth might need additional strategy
                // For MVP, we'll return the first matched user account to that email.
            },
            include: {
                organization: true,
                subscriptions: true
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Return user excluding password hash for security (cast to any to satisfy TS destructure)
        const { passwordHash, ...safeUser } = user as any;

        return NextResponse.json(safeUser);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
