import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = globalThis as unknown as { prisma_v2: PrismaClient };

// Initialize the Prisma Client with the pg driver adapter as required by Prisma v7
const getPrismaClient = () => {
    if (!globalForPrisma.prisma_v2) {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        globalForPrisma.prisma_v2 = new PrismaClient({ adapter });
    }
    return globalForPrisma.prisma_v2;
};

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma_v2 = prisma;
}

export default prisma;
