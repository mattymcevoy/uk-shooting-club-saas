import { prisma } from "@/lib/prisma";

/**
 * Adds a user to an event waitlist, checking capacity automatically.
 */
export async function joinWaitlist(userId: string, eventId: string, organizationId: string) {
    const existingEntry = await prisma.waitlistEntry.findFirst({
        where: { userId, eventId, organizationId, status: "PENDING" }
    });

    if (existingEntry) {
        throw new Error("User is already on the waitlist for this event.");
    }

    return prisma.waitlistEntry.create({
        data: {
            userId,
            eventId,
            organizationId,
            status: "PENDING"
        }
    });
}

/**
 * Triggers an automatic promotion of the first user on the waitlist.
 * Designed to be called primarily by webhooks when a booking is cancelled.
 */
export async function autoPromoteWaitlist(eventId: string) {
    // Check if event still has capacity
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { bookings: true }
    });

    if (!event || !event.maxAttendees || event.bookings.length >= event.maxAttendees) {
        return null; // Event doesn't exist or is currently full
    }

    // Find the oldest pending waitlist entry
    const nextInLine = await prisma.waitlistEntry.findFirst({
        where: { eventId, status: "PENDING" },
        orderBy: { createdAt: "asc" }
    });

    if (!nextInLine) {
        return null; // Waitlist is empty
    }

    // Process promotion atomially within a transaction
    return prisma.$transaction(async (tx) => {
        const promoted = await tx.waitlistEntry.update({
            where: { id: nextInLine.id },
            data: { status: "PROMOTED", updatedAt: new Date() }
        });

        // Generate the actual booking ticket for the user
        const booking = await tx.booking.create({
            data: {
                userId: promoted.userId,
                eventId: event.id,
                organizationId: event.organizationId,
                startTime: event.date,
                endTime: new Date(event.date.getTime() + 60 * 60 * 1000), // Default 1 hour
                status: "PENDING", // Wait for payment if necessary
            }
        });

        return { promoted, booking };
    });
}
