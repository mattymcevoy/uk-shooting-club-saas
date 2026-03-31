import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orgId = (session.user as any).organizationId;

        const coaches = await prisma.user.findMany({
            where: {
                organizationId: orgId,
                role: { in: ["COACH", "ADMIN", "OWNER"] },
                status: "ACTIVE"
            },
            select: { id: true, name: true, image: true, role: true }
        });

        return NextResponse.json(coaches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
