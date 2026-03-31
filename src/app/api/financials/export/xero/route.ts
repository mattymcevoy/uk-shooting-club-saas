import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const invoices = await prisma.invoice.findMany({
        where: { status: "PAID" },
        include: { user: true }
    });

    let csvContent = "ContactName,EmailAddress,InvoiceNumber,Reference,InvoiceDate,DueDate,Total,TaxAmount,AccountCode\n";
    for (const inv of invoices) {
        csvContent += `"${inv.user.name || 'N/A'}","${inv.user.email || 'N/A'}","${inv.id}","Club Sub","${new Date(inv.createdAt).toISOString().split('T')[0]}","${new Date(inv.createdAt).toISOString().split('T')[0]}",${(inv.amount/100).toFixed(2)},0,"200"\n`;
    }

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="Xero_Export_${Date.now()}.csv"`
        }
    });
}
