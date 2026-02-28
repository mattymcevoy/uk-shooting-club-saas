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
        include: { user: true, facility: true },
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

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Financial Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
                                        <p className="font-semibold text-gray-900">{booking.facility.name}</p>
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
        </div>
    );
}
