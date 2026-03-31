import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { joinWaitlist } from "@/lib/services/waitlists";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const orgId = (session.user as any).organizationId;
        
        // Use backend service to safely inject into priority queue
        const entry = await joinWaitlist((session.user as any).id, params.id, orgId);

        return NextResponse.json(entry, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
