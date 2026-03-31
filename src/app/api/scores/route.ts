import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLeaderboardByDiscipline, logDisciplineScore } from "@/lib/services/scoring";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        let disciplineId = searchParams.get("disciplineId");

        // Seed basic disciplines lazily if none exist (for simple setup)
        if (!disciplineId) {
            const orgId = "seed-org-id"; // fallback org or real org
            let defaultDisc = await prisma.discipline.findFirst();
            if (!defaultDisc) {
                defaultDisc = await prisma.discipline.create({
                    data: { name: "Olympic Trap", organizationId: "global" }
                });
                await prisma.discipline.create({ data: { name: "English Skeet", organizationId: "global" }});
            }
            disciplineId = defaultDisc.id;
        }

        const season = new Date().getFullYear().toString();
        const leaderboard = await getLeaderboardByDiscipline(disciplineId, season);
        const disciplines = await prisma.discipline.findMany();

        return NextResponse.json({ leaderboard, disciplines, activeDisciplineId: disciplineId });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const score = await logDisciplineScore((session.user as any).id, body.disciplineId, body.hits, body.totalTargets);
        return NextResponse.json(score, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
