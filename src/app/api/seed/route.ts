import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: 'Default Shooting Club',
                    themeColor: '#10b981',
                }
            });
        }

        const members = [
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+44 7700 900001',
                membershipTier: 'FULL_MEMBER',
                status: 'ACTIVE',
                isLicenseHolder: true,
                isRegisteredShooter: true,
                certificateNumber: 'CERT-1001',
                membershipNumber: 'NRS-1234567',
                organizationId: org.id
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+44 7700 900002',
                membershipTier: 'GUEST',
                status: 'ACTIVE',
                isLicenseHolder: false,
                isRegisteredShooter: false,
                organizationId: org.id
            },
            {
                name: 'Robert Brown',
                email: 'robert.b@example.com',
                phone: '+44 7700 900003',
                membershipTier: 'VIP',
                status: 'ACTIVE',
                isLicenseHolder: true,
                isRegisteredShooter: true,
                certificateNumber: 'CERT-9999',
                membershipNumber: 'NRS-9999999',
                organizationId: org.id
            }
        ];

        let createdCount = 0;
        for (const m of members) {
            const exists = await prisma.user.findFirst({ where: { email: m.email } });
            if (!exists) {
                await prisma.user.create({ data: m as any });
                createdCount++;
            }
        }

        // Enforce new user balance defaults on the test user database independently of Next.js Turbopack cache
        await prisma.$executeRawUnsafe('UPDATE "User" SET "creditBalance" = 5000, "clayBalance" = 100;');

        // Safely force all current generic testing mocked users to share a universal testing password 'P4ssw0rd'
        const passwordHash = await bcrypt.hash('P4ssw0rd', 10);
        await prisma.user.updateMany({
            data: { passwordHash: passwordHash }
        });

        // Patch any existing Full Members or VIPs that don't have a membership number
        const usersToPatch: any[] = await prisma.$queryRawUnsafe(`
            SELECT id FROM "User" 
            WHERE ("membershipTier" = 'FULL_MEMBER' OR "membershipTier" = 'VIP') 
            AND "membershipNumber" IS NULL
        `);

        for (const u of usersToPatch) {
            const num = "NRS-" + String(Math.floor(Math.random() * 9000000) + 1000000);
            await prisma.$executeRawUnsafe(`
                UPDATE "User"
                SET "membershipNumber" = $1
                WHERE id = $2
            `, num, u.id);
        }

        return NextResponse.json({ success: true, message: `Created ${createdCount} users. Balances reset. Universal Testing Password globally mapped to 'P4ssw0rd'.` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
