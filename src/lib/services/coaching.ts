import { prisma } from "@/lib/prisma";

export async function createCoachSession(memberId: string, coachId: string, startTime: Date, endTime: Date) {
    // Validate that the Coach actually is marked as a Coach via RBAC matrices
    const coachUser = await prisma.user.findUnique({ where: { id: coachId } });
    if (!coachUser || coachUser.role !== "COACH" && coachUser.role !== "OWNER" && coachUser.role !== "ADMIN") {
        throw new Error("Target user is not authorized to act as a Coach.");
    }

    // Provision the Calendar Event
    return prisma.coachSession.create({
        data: {
            memberId,
            coachId,
            startTime,
            endTime
        }
    });
}

export async function addProgressNote(coachId: string, memberId: string, content: string) {
    return prisma.progressNote.create({
        data: {
            memberId,
            coachId,
            content,
            date: new Date()
        }
    });
}

export async function getCoachSchedule(coachId: string, rangeStart: Date, rangeEnd: Date) {
    return prisma.coachSession.findMany({
        where: {
            coachId,
            startTime: { gte: rangeStart },
            endTime: { lte: rangeEnd }
        },
        include: {
            member: { select: { id: true, name: true, membershipTier: true } }
        },
        orderBy: { startTime: 'asc' }
    });
}
