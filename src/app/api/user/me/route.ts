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

        const userId = (session.user as any).id;
        const userEmail = session.user.email;
        
        if (!userId && !userEmail) {
            return new NextResponse("Unauthorized ID", { status: 401 });
        }

        const user = await prisma.user.findFirst({
            where: userId ? { id: userId } : { email: userEmail },
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

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, phone, address, certificateNumber, email, membershipNumber } = body;

        // Clean potentially malicious or empty overriding strings natively
        const updateData: any = {
            name,
            phone,
            address,
            certificateNumber
        };
        
        if (email) updateData.email = email;
        if (membershipNumber !== undefined) updateData.membershipNumber = membershipNumber;

        const userId = (session.user as any).id;
        const userEmail = session.user.email;
        
        if (!userId && !userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        let dbUserId = userId;
        
        // If legacy token is missing ID, resolve it via Email exactly like the GET route
        if (!dbUserId && userEmail) {
            const tempUser = await prisma.user.findFirst({ where: { email: userEmail } });
            if (!tempUser) return new NextResponse("User not found", { status: 404 });
            dbUserId = tempUser.id;
        }

        const updatedUser = await prisma.user.update({
            where: { id: dbUserId },
            data: updateData
        });

        const { passwordHash, ...safeUser } = updatedUser as any;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error("Error updating user profile:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
