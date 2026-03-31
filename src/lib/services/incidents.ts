import { prisma } from "@/lib/prisma";

export async function logSafetyIncident(reporterId: string, organizationId: string, param: { type: "SAFETY_BREACH" | "EQUIPMENT_FAULT" | "RCO_NOTE", severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", description: string, actionTaken?: string }) {
    
    return prisma.incidentLog.create({
        data: {
            reporterId,
            organizationId,
            date: new Date(),
            type: param.type,
            severity: param.severity,
            description: param.description,
            actionTaken: param.actionTaken
        }
    });
}

export async function getIncidentsByOrganization(organizationId: string, limit = 50) {
    return prisma.incidentLog.findMany({
        where: { organizationId },
        orderBy: { date: 'desc' },
        take: limit,
        include: {
            reporter: { select: { name: true, email: true, role: true } }
        }
    });
}
