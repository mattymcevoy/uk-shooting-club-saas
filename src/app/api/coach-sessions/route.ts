import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCoachSession, getCoachSchedule } from "@/lib/services/coaching";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const coachId = searchParams.get("coachId") || session.user.id;
        
        const start = new Date(searchParams.get("start") || new Date().toISOString());
        const end = new Date(searchParams.get("end") || new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());

        const schedule = await getCoachSchedule(coachId, start, end);
        return NextResponse.json(schedule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { coachId, startTime, endTime } = await req.json();

        if (!coachId || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing body fields" }, { status: 400 });
        }

        const booking = await createCoachSession(session.user.id, coachId, new Date(startTime), new Date(endTime));

        return NextResponse.json(booking, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
