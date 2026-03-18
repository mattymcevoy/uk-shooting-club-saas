const { PrismaClient } = require('@prisma/client');

async function testCreate() {
    console.log('Testing Prisma Event Create...');
    const prisma = new PrismaClient();

    try {
        const org = await prisma.organization.findFirst();
        if (!org) {
            console.log('No organization found.');
            return;
        }

        console.log('Creating event for org:', org.id);
        const parseTime = (dateStr, timeStr) => {
            if (!timeStr) return null;
            return new Date(`${dateStr}T${timeStr}:00`);
        };

        const event = await prisma.event.create({
            data: {
                organizationId: org.id,
                title: 'Test Event from Node',
                description: 'A test event created via script',
                date: new Date('2026-06-15'),
                signInTime: parseTime('2026-06-15', '09:00'),
                startTime: parseTime('2026-06-15', '10:00'),
                maxAttendees: 50,
                eventType: 'COMPETITION',
                entryFee: 1500,
            }
        });

        console.log('Successfully created event:', event.id);
    } catch (e) {
        console.error('Prisma Create Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
testCreate();
