import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addProgressNote } from "@/lib/services/coaching";
import { hasPermission, Role } from "@/lib/rbac";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must be at least a COACH to write progress notes about a member.
        const userRole = (session.user as any).role as Role;
        if (!hasPermission(userRole, "COACH")) {
            return NextResponse.json({ error: "Forbidden. Insufficient clearance." }, { status: 403 });
        }

        const { memberId, content } = await req.json();

        if (!memberId || !content) {
            return NextResponse.json({ error: "Missing memberId or content" }, { status: 400 });
        }

        const note = await addProgressNote(session.user.id, memberId, content);

        return NextResponse.json(note, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
