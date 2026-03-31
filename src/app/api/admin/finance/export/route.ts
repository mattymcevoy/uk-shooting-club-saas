import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'finance', action: 'export' } });
  if (error || !context) return error!;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { createdAt: 'desc' }
  });

  const header = 'id,amount,currency,status,createdAt';
  const lines = invoices.map(i => `${i.id},${i.amount},${i.currency},${i.status},${i.createdAt.toISOString()}`);
  const csv = [header, ...lines].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="finance-export-${Date.now()}.csv"`
    }
  });
}
