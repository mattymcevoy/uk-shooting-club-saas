import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, context } = await getRequestContext({ permission: { resource: 'campaigns', action: 'read' } });
  if (error || !context) return error!;

  const campaigns = await prisma.communicationCampaign.findMany({
    where: { organizationId: context.user.organizationId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const { error, context } = await getRequestContext({ permission: { resource: 'campaigns', action: 'create' } });
  if (error || !context) return error!;

  const body = await req.json();
  const { name, audienceFilter, channel, scheduledAt } = body;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const created = await prisma.communicationCampaign.create({
    data: {
      organizationId: context.user.organizationId,
      createdById: context.user.id,
      name,
      audienceFilter: audienceFilter || null,
      channel: channel || 'EMAIL',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: 'DRAFT',
    }
  });

  return NextResponse.json(created, { status: 201 });
}
