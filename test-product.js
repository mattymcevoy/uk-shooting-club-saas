const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const org = await prisma.organization.findFirst();
        console.log("Org ID:", org?.id);
        
        const product = await prisma.product.create({
            data: {
                organizationId: org.id,
                name: "Test 100 Clays",
                description: "Test",
                price: 3500,
                isDigital: true,
                claysAmount: 100,
                stock: 0,
                expiresAt: null,
                isActive: true
            }
        });
        
        console.log("Success:", product);
    } catch (e) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
