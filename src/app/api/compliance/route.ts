import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getExpiringCertificates, uploadComplianceDocument } from "@/lib/services/compliance";
import { hasPermission, Role } from "@/lib/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = (session.user as any).role as Role;
        if (!hasPermission(userRole, "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const orgId = (session.user as any).organizationId;
        const records = await getExpiringCertificates(orgId, 90); // within 90 days

        return NextResponse.json(records);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const orgId = (session.user as any).organizationId;
        const body = await req.json();

        // In a real app this docUrl comes from Vercel Blob / AWS S3
        if (!body.type || !body.docUrl || !body.expiry) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const record = await uploadComplianceDocument(
            (session.user as any).id, 
            orgId, 
            body.type, 
            body.docUrl, 
            new Date(body.expiry)
        );

        return NextResponse.json(record, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
