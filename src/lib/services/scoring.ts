import { prisma } from "@/lib/prisma";

export async function logDisciplineScore(userId: string, disciplineId: string, hits: number, total: number, eventId?: string, handicapOverride?: number) {
    // Internal Handicap logic
    // Usually based on rolling average, here mocked directly for scoring log
    const computedHandicap = handicapOverride ?? (total > 0 ? ((total - hits) / total) * 0.5 : 0.0);

    return prisma.score.create({
        data: {
            userId,
            disciplineId,
            hits,
            totalTargets: total,
            handicap: computedHandicap,
            eventId,
            season: `${new Date().getFullYear()}`
        }
    });
}

export async function getLeaderboardByDiscipline(disciplineId: string, season: string) {
    // Generate averages per user aggregating raw hits
    const rawScores = await prisma.score.findMany({
        where: { disciplineId, season },
        include: { user: { select: { name: true, image: true, membershipTier: true } } }
    });

    const userAggregates = new Map<string, { userId: string, name: string, totalHits: number, attempts: number, average: number }>();

    rawScores.forEach(score => {
        if (!userAggregates.has(score.userId)) {
            userAggregates.set(score.userId, {
                userId: score.userId,
                name: score.user.name || "Unknown Shooter",
                totalHits: 0,
                attempts: 0,
                average: 0
            });
        }
        
        const agg = userAggregates.get(score.userId)!;
        agg.totalHits += score.hits;
        agg.attempts += 1;
        agg.average = agg.totalHits / agg.attempts;
    });

    const leaderboard = Array.from(userAggregates.values());
    leaderboard.sort((a, b) => b.average - a.average);

    return leaderboard;
}
