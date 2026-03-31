import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const invoices = await prisma.invoice.findMany({
        where: { status: "PAID" },
        include: { user: true }
    });

    // Formatting for Quickbooks mapping
    let csvContent = "Customer,Email,InvoiceNo,Memo,Date,DueDate,Amount,Item,TaxCode\n";
    for (const inv of invoices) {
        csvContent += `"${inv.user.name || 'N/A'}","${inv.user.email || 'N/A'}","${inv.id}","${inv.description || "Club Subscription"}","${new Date(inv.createdAt).toISOString().split('T')[0]}","${new Date(inv.createdAt).toISOString().split('T')[0]}",${(inv.amount/100).toFixed(2)},"SaaS","EXEMPT"\n`;
    }

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="QuickBooks_Export_${Date.now()}.csv"`
        }
    });
}
