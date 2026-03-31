import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logSafetyIncident, getIncidentsByOrganization } from "@/lib/services/incidents";
import { hasPermission, Role } from "@/lib/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must be Reception, Admin, or Owner to view all safety incidents
        if (!hasPermission((session.user as any).role as Role, "RECEPTION")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const orgId = (session.user as any).organizationId;
        const incidents = await getIncidentsByOrganization(orgId);

        return NextResponse.json(incidents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Any authenticated staff or members could potentially log safety issues, 
        // but let's restrict to Coach+ or Reception+ to avoid spam.
        if (!hasPermission((session.user as any).role as Role, "MEMBER")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const orgId = (session.user as any).organizationId;
        const body = await req.json();

        if (!body.type || !body.severity || !body.description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const incident = await logSafetyIncident(session.user.id, orgId, {
            type: body.type,
            severity: body.severity,
            description: body.description,
            actionTaken: body.actionTaken
        });

        return NextResponse.json(incident, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
