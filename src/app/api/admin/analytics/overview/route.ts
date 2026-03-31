import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/authz';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'analytics', action: 'read' } });
  if (error || !context) return error!;

  const [bookings, attended, cancelled, events, revenue] = await Promise.all([
    prisma.booking.count({ where: { organizationId: context.user.organizationId } }),
    prisma.booking.count({ where: { organizationId: context.user.organizationId, status: 'ATTENDED' } }),
    prisma.booking.count({ where: { organizationId: context.user.organizationId, status: 'CANCELLED' } }),
    prisma.event.count({ where: { organizationId: context.user.organizationId } }),
    prisma.invoice.aggregate({ where: { organizationId: context.user.organizationId, status: 'PAID' }, _sum: { amount: true } }),
  ]);

  const noShowRate = bookings > 0 ? Number((((bookings - attended - cancelled) / bookings) * 100).toFixed(2)) : 0;

  return NextResponse.json({
    bookings,
    attended,
    cancelled,
    noShowRate,
    events,
    paidRevenue: revenue._sum.amount || 0,
  });
}
