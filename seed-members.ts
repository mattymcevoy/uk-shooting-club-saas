import { prisma } from './src/lib/prisma.js';

async function main() {
    console.log('Fetching or creating organization...');
    let org = await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Default Shooting Club',
                themeColor: '#10b981',
            }
        });
    }

    console.log(`Using Organization ID: ${org.id}`);

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
            organizationId: org.id
        }
    ];

    for (const m of members) {
        const exists = await prisma.user.findUnique({ where: { email: m.email } });
        if (!exists) {
            await prisma.user.create({ data: m });
            console.log(`Created user: ${m.name}`);
        } else {
            console.log(`User already exists: ${m.name}`);
        }
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
