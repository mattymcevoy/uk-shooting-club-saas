import prisma from '@/lib/prisma';
import EWalletClientViewer from './EWalletClientViewer';

export const dynamic = 'force-dynamic';

export default async function DetailedEWalletAuditPage() {
    // 1. Fetch aggregate wallet liabilities (the Club's holdings)
    const eWalletAggregation = await prisma.user.aggregate({
        _sum: { creditBalance: true },
        where: { creditBalance: { gt: 0 } }
    });
    
    // 2. Fetch all users who have an active E-Wallet (either money left or past transactions)
    const walletHolders = await prisma.user.findMany({
        where: {
            OR: [
                { creditBalance: { gt: 0 } },
                { walletTx: { some: {} } }
            ]
        },
        include: {
            walletTx: {
                orderBy: { createdAt: 'desc' },
                take: 100 // limit to last 100 per user for the audit fast-load
            }
        },
        orderBy: { creditBalance: 'desc' },
    });

    const totalEWalletFunds = (eWalletAggregation._sum.creditBalance || 0) / 100;

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">E-Wallet Financial Audit</h1>
                    <p className="text-gray-500 mt-2">PCI-compliant internal register of all active member ledgers and unspent liabilities.</p>
                </div>
                <div className="mt-4 md:mt-0 bg-gradient-to-br from-emerald-900 to-black px-8 py-4 rounded-xl shadow-lg border border-emerald-500/30 text-right">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Club Liability</p>
                    <p className="text-3xl font-black text-emerald-400">£{totalEWalletFunds.toFixed(2)}</p>
                </div>
            </div>

            {/* Pass the fully resolved ledger data down to the heavily Interactive Client Component */}
            <EWalletClientViewer holders={walletHolders} totalFunds={totalEWalletFunds} />
        </div>
    );
}
