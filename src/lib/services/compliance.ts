import { prisma } from "@/lib/prisma";

export async function uploadComplianceDocument(userId: string, orgId: string, type: "GUN_LICENSE" | "SAFETY_CERT" | "INSURANCE", docUrl: string, expiry: Date) {
    return prisma.complianceRecord.create({
        data: {
            userId,
            organizationId: orgId,
            type,
            documentUrl: docUrl,
            expiryDate: expiry,
            isApproved: false // Requires Admin sign-off
        }
    });
}

export async function approveComplianceDocument(recordId: string) {
    return prisma.complianceRecord.update({
        where: { id: recordId },
        data: { isApproved: true }
    });
}

export async function getExpiringCertificates(organizationId: string, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.complianceRecord.findMany({
        where: {
            organizationId,
            expiryDate: {
                lte: thresholdDate, // EXPIRES ON OR BEFORE threshold
                gt: new Date()      // HAS NOT YET EXPIRED
            },
            isApproved: true
        },
        include: {
            user: { select: { name: true, email: true } }
        }
    });
}

/**
 * Designed to be executed safely via a nightly Vercel Serverless CRON Job
 * to dispatch reminders when threshold matches.
 */
export async function triggerComplianceReminders() {
    // Stub definition for automated emailing integration
    const expiring = await getExpiringCertificates("global-trigger", 30);
    // for (const req of expiring) { await emailWorker(req.user.email); }
    return expiring;
}
