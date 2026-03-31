import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const bookings = await prisma.booking.findMany({
        where: { status: { in: ["CONFIRMED", "ATTENDED"] } }
    });

    // Simple mock VAT aggregation report
    let totalSales = 0;
    for (const b of bookings) {
        totalSales += b.amountPaid;
    }

    // Standard UK VAT
    const netSales = totalSales / 1.20;
    const vatOwed = totalSales - netSales;

    let csvContent = `Period,GrossSales,NetSales,VATOwed,Currency\n`;
    csvContent += `Current,${(totalSales/100).toFixed(2)},${(netSales/100).toFixed(2)},${(vatOwed/100).toFixed(2)},GBP\n`;

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="VAT_Report_${Date.now()}.csv"`
        }
    });
}
