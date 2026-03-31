import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, BookingConfirmationEmail } from '@/lib/emails/mailer';
import { getRequestContext } from '@/lib/authz';

export async function POST(req: Request) {
    try {
        const { error, context } = await getRequestContext();
        if (error || !context) return error!;
        const organizationId = context.user.organizationId;
        const body = await req.json();
        // tickets should be an array of: { squadId?: string, attendeeName?: string }
        const { eventId, paymentType, tickets = [{}], joinWaitlist = false } = body;

        if (!eventId || !paymentType) {
            return NextResponse.json({ error: 'Event ID and Payment Type are required' }, { status: 400 });
        }

        if (tickets.length > 12) {
            return NextResponse.json({ error: 'You cannot purchase more than 12 tickets at a time.' }, { status: 400 });
        }
        if (!Array.isArray(tickets) || tickets.length < 1) {
            return NextResponse.json({ error: 'At least one ticket is required.' }, { status: 400 });
        }

        // 1. Get User
        const user = await prisma.user.findFirst({
            where: { id: context.user.id, organizationId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Get Event and check capacity
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { bookings: true } }, squads: true }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.organizationId !== organizationId) {
            return NextResponse.json({ error: 'Event not available for your organization.' }, { status: 403 });
        }

        if (event.maxAttendees && event._count.bookings + tickets.length > event.maxAttendees) {
            if (joinWaitlist) {
                const waitlist = await prisma.waitlistEntry.upsert({
                    where: {
                        eventId_userId: {
                            eventId: event.id,
                            userId: user.id
                        }
                    },
                    create: {
                        eventId: event.id,
                        userId: user.id,
                        organizationId,
                        requestedTickets: tickets.length,
                        status: 'WAITING',
                        notes: `Auto-waitlisted after full event check (${tickets.length} requested).`
                    },
                    update: {
                        requestedTickets: tickets.length,
                        status: 'WAITING',
                        notes: `Updated waitlist request (${tickets.length} requested).`
                    }
                });

                return NextResponse.json({
                    success: true,
                    waitlisted: true,
                    waitlistId: waitlist.id,
                    message: 'Event is currently full. You have been added to the waitlist.'
                }, { status: 202 });
            }

            return NextResponse.json({
                error: `Not enough space left. Only ${event.maxAttendees - event._count.bookings} spots remaining.`,
                canJoinWaitlist: true
            }, { status: 400 });
        }

        // 3. Verify Squad capacities before processing
        const squadCounts: Record<string, number> = {};
        for (const t of tickets) {
            if (t.squadId) {
                squadCounts[t.squadId] = (squadCounts[t.squadId] || 0) + 1;
            }
        }

        for (const squadId of Object.keys(squadCounts)) {
            const squad = event.squads.find(s => s.id === squadId);
            if (!squad) return NextResponse.json({ error: `Squad ${squadId} not found` }, { status: 400 });

            const currentOccupancy = await prisma.booking.count({
                where: { eventId, squadId, status: { not: 'CANCELLED' } }
            });

            if (currentOccupancy + squadCounts[squadId] > squad.maxCapacity) {
                return NextResponse.json({ error: `Squad "${squad.name}" does not have enough space for ${squadCounts[squadId]} tickets.` }, { status: 400 });
            }
        }

        // 4. Calculate amount required
        const baseFee = paymentType === 'FULL' ? event.entryFee : Math.ceil(event.entryFee * 0.25);
        const totalFeeAmount = baseFee * tickets.length;

        if (user.creditBalance < totalFeeAmount) {
            return NextResponse.json({
                error: 'Insufficient Wallet Balance.',
                missingAmount: totalFeeAmount - user.creditBalance
            }, { status: 402 });
        }

        // 5. Execute transaction (Deduct & Create Bookings)
        const result = await prisma.$transaction(async (tx) => {
            // Deduct credits
            await tx.user.update({
                where: { id: user.id },
                data: { creditBalance: { decrement: totalFeeAmount } }
            });

            const defaultEndTime = new Date(event.date);
            defaultEndTime.setHours(defaultEndTime.getHours() + 2);

            // Create bookings
            const bookingsToCreate = tickets.map((t: any, index: number) => ({
                userId: user.id,
                organizationId,
                facilityId: null,
                eventId: event.id,
                startTime: event.date,
                endTime: defaultEndTime,
                status: 'CONFIRMED' as any,
                amountPaid: baseFee,
                squadId: t.squadId || null,
                attendeeName: t.attendeeName || (index === 0 ? user.name : `Guest ${index}`)
            }));

            await tx.booking.createMany({
                data: bookingsToCreate
            });

            // Record transaction history
            await tx.walletTransaction.create({
                data: {
                    userId: user.id,
                    type: 'USAGE',
                    amount: -totalFeeAmount,
                    description: `Event Tickets (x${tickets.length} ${paymentType}): ${event.title}`,
                }
            });

            return true;
        });

        // 6. Send Automated Confirmation Email
        // Calculate dynamic registration times for the email if a squad was chosen
        const emailSquads = tickets.map((t: any) => {
            if (!t.squadId) return null;
            const sq = event.squads.find((s: any) => s.id === t.squadId);
            if (!sq) return null;

            let regTime = 'Determined by Organizer';
            if (sq.startTime) {
                const d = new Date(sq.startTime);
                d.setMinutes(d.getMinutes() - 45);
                regTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return { name: sq.name, startTime: regTime };
        }).filter(Boolean);

        // Deduplicate squads for the email summary
        const uniqueSquads = Array.from(new Map(emailSquads.map((item: any) => [item.name, item])).values());

        await sendEmail({
            to: user.email!,
            subject: `Booking Confirmed: ${event.title}`,
            react: BookingConfirmationEmail({
                name: user.name || 'Member',
                eventName: event.title,
                dateStr: new Date(event.date).toLocaleDateString(),
                totalTickets: tickets.length,
                totalPaid: totalFeeAmount,
                squadDetails: uniqueSquads
            })
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error('Event Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
