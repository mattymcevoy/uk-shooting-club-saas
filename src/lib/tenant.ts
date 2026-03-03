import { prisma } from './prisma';

// This utility simulates Tenant (Organization) resolution.
// In a full production B2B SaaS, this ID would be derived from:
// 1. The custom subdomain (e.g., clubname.shootingapp.com)
// 2. The authenticated user's session claims
//
// For this stage of the demo, we instantly provision a default tenant.
export async function getCurrentOrganizationId(): Promise<string> {
    let org = await prisma.organization.findFirst();

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'The Royal Shooting Club',
                themeColor: '#10b981', // Emerald
                subscriptionStatus: 'TRIALING',
            }
        });
        console.log('✅ Auto-provisioned Default Tenant:', org.id);
    }

    return org.id;
}
