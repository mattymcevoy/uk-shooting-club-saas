import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { approveComplianceDocument } from "@/lib/services/compliance";
import { hasPermission, Role } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: { recordId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = (session.user as any).role as Role;
        if (!hasPermission(userRole, "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const record = await approveComplianceDocument(params.recordId);

        return NextResponse.json(record, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
