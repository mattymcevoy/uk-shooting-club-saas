import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();
        const body = await req.json();
        
        const isDigital = body.isDigital || false;
        const parsedClays = parseInt(body.claysAmount);
        const parsedStock = parseInt(body.stock);
        const claysToSave = (isDigital && !isNaN(parsedClays)) ? parsedClays : null;
        const stockToSave = (!isDigital && !isNaN(parsedStock)) ? parsedStock : 0;
        const expiresToSave = body.expiresAt ? new Date(body.expiresAt) : null;
        const isActive = body.isActive !== undefined ? body.isActive : true;

        await prisma.$executeRawUnsafe(`
            UPDATE "Product" 
            SET "name" = $1, "description" = $2, "price" = $3, "isDigital" = $4, "claysAmount" = $5, "stock" = $6, "expiresAt" = $7, "isActive" = $8, "updatedAt" = NOW()
            WHERE "id" = $9 AND "organizationId" = $10
        `, body.name, body.description || null, body.price, isDigital, claysToSave, stockToSave, expiresToSave, isActive, params.id, organizationId);

        return NextResponse.json({ success: true, updated: params.id });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = await getCurrentOrganizationId();

        await prisma.$executeRawUnsafe(`DELETE FROM "Product" WHERE "id" = $1 AND "organizationId" = $2`, params.id, organizationId);

        return NextResponse.json({ success: true, message: "Product deleted." });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
