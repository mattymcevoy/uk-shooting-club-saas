export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export default async function FinancialDashboard() {
    // Aggregate recent invoices
    const recentInvoices = await prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
    });

    // Aggregate recent bookings
    const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true, facility: true, event: true },
    });

    // Fetch Recent E-Wallet Transactions (Deposits and Purchases)
    const recentTransactions = await prisma.walletTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
    });

    // Calculate total revenue from paid invoices and bookings
    const paidInvoicesAggregation = await prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
    });

    const paidBookingsAggregation = await prisma.booking.aggregate({
        _sum: { amountPaid: true },
        where: { status: { in: ['CONFIRMED', 'ATTENDED'] } },
    });

    const totalInvoiceRevenue = (paidInvoicesAggregation._sum.amount || 0) / 100;
    const totalBookingRevenue = (paidBookingsAggregation._sum.amountPaid || 0) / 100;
    const totalRevenue = totalInvoiceRevenue + totalBookingRevenue;

    // Aggregate global e-wallet liabilities (what the club holds physically on behalf of members)
    const eWalletAggregation = await prisma.user.aggregate({
        _sum: { creditBalance: true },
        where: { creditBalance: { gt: 0 } }
    });
    const totalEWalletFunds = (eWalletAggregation._sum.creditBalance || 0) / 100;

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h1>
                
                {/* Floating Export Menu Bar */}
                <div className="flex space-x-3 bg-white/80 p-2 rounded-xl shadow-lg border border-gray-200 items-center">
                    <span className="text-xs font-bold text-gray-400 pl-2 pr-1 uppercase">Exports:</span>
                    <a href="/api/financials/export/xero" className="px-4 py-2 bg-[#13B5EA] text-white rounded-lg text-sm font-bold hover:bg-[#10a1d1] shadow transition">Xero CSV</a>
                    <a href="/api/financials/export/quickbooks" className="px-4 py-2 bg-[#2CA01C] text-white rounded-lg text-sm font-bold hover:bg-[#258b16] shadow transition">QuickBooks CSV</a>
                    <a href="/api/financials/export/vat" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow transition">VAT Liability</a>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</h2>
                    <p className="text-5xl font-black text-emerald-600">£{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Subscription MRR</h2>
                    <p className="text-5xl font-black text-blue-600">£{totalInvoiceRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Booking Revenue</h2>
                    <p className="text-5xl font-black text-indigo-600">£{totalBookingRevenue.toFixed(2)}</p>
                </div>
                
                {/* Selectable E-Wallet Tile */}
                <a href="/admin/financials/e-wallets" className="block group">
                    <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-lg border border-emerald-500/20 flex flex-col justify-center h-full transition-transform transform group-hover:-translate-y-1 group-hover:shadow-emerald-900/30">
                        <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 group-hover:text-gray-300">Total E-Wallet Funds</h2>
                        <p className="text-4xl font-black text-emerald-400">£{totalEWalletFunds.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                            View Detailed Wallet Audit <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </p>
                    </div>
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Invoices */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Invoices</h2>
                    {recentInvoices.length === 0 ? (
                        <p className="text-gray-500 italic">No invoices found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {recentInvoices.map((invoice: any) => (
                                <li key={invoice.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/60 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-900">{invoice.user.name}</p>
                                        <p className="text-sm text-gray-500">{invoice.description || 'Stripe Subscription'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">£{(invoice.amount / 100).toFixed(2)}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent Bookings */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Bookings</h2>
                    {recentBookings.length === 0 ? (
                        <p className="text-gray-500 italic">No bookings found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {recentBookings.map((booking: any) => (
                                <li key={booking.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/60 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-900">{booking.facility?.name || booking.event?.title || 'Event Booking'}</p>
                                        <p className="text-sm text-gray-500">
                                            {booking.user.name} • {format(new Date(booking.startTime), 'MMM d, h:mm a')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">£{(booking.amountPaid / 100).toFixed(2)}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* E-Wallet Transaction Receipts Log */}
            <div className="mt-8 bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Digital Wallet Activity Log</h2>
                {recentTransactions.length === 0 ? (
                    <p className="text-gray-500 italic">No wallet transactions recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-4 font-semibold text-gray-600">Date/Time</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Member Name</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Membership Number</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Transaction Details</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Type</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">Value Initiated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-white/60 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-500">{format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}</td>
                                        <td className="py-4 px-4 font-bold text-gray-900">{tx.user?.name || "Unknown"}</td>
                                        <td className="py-4 px-4 font-mono text-sm text-gray-600">{tx.user?.membershipNumber || "N/A"}</td>
                                        <td className="py-4 px-4 text-gray-700">{tx.description || "N/A"}</td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}£{(tx.amount / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
