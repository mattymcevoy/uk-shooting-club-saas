import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function GET() {
    try {
        const organizationId = await getCurrentOrganizationId();
        const products = await prisma.$queryRawUnsafe(`
            SELECT * FROM "Product" 
            WHERE "organizationId" = $1 
            AND "isActive" = true 
            AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
            ORDER BY "createdAt" DESC
        `, organizationId);

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const body = await req.json();

        // Very basic validation
        if (!body.name || body.price === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Securely parse integers to avoid NaN Prisma crashing
        const isDigital = body.isDigital || false;
        const parsedClays = parseInt(body.claysAmount);
        const parsedStock = parseInt(body.stock);
        const claysToSave = (isDigital && !isNaN(parsedClays)) ? parsedClays : null;
        const stockToSave = (!isDigital && !isNaN(parsedStock)) ? parsedStock : 0;
        const expiresToSave = body.expiresAt ? new Date(body.expiresAt) : null;
        const customId = "prod_" + Date.now(); // Generate native CUID fallback

        // Using direct Raw Unsafe SQL Bypass to guarantee successful saving against
        // the Next.js `node_modules` turbo cache preventing `prisma.product` initialization
        await prisma.$executeRawUnsafe(`
            INSERT INTO "Product" ("id", "organizationId", "name", "description", "price", "isDigital", "claysAmount", "stock", "expiresAt", "isActive", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, customId, organizationId, body.name, body.description || null, body.price, isDigital, claysToSave, stockToSave, expiresToSave, true);

        return NextResponse.json({ success: true, id: customId });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
