import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'privacy', action: 'export' } });
  if (error || !context) return error!;

  const user = await prisma.user.findFirst({
    where: {
      id: context.user.id,
      organizationId: context.user.organizationId,
    },
    include: {
      bookings: true,
      walletTx: true,
      waitlistEntries: true,
      complianceDocuments: true,
      privacyRequests: true,
    }
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    data: user,
  });
}
