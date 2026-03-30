'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function EWalletClientViewer({ holders }: { holders: any[], totalFunds: number }) {
    const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

    const toggleWallet = (id: string) => {
        setExpandedWallet(expandedWallet === id ? null : id);
    };

    // CSV Generator Function for PCI Export
    const downloadReport = (holder: any) => {
        const headers = ["Transaction ID,Date,Type,Amount (GBP),Description,Payment Intent"];
        const rows = (holder.walletTx || []).map((tx: any) => {
            const dateStr = format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm:ss');
            const amtStr = (tx.amount / 100).toFixed(2);
            // Replace commas in descriptions to prevent CSV breaking
            const cleanDesc = (tx.description || '').replace(/,/g, ' '); 
            const paymentIntent = tx.stripePaymentIntentId || '';
            
            return `"${tx.id}","${dateStr}","${tx.type}","${amtStr}","${cleanDesc}","${paymentIntent}"`;
        });

        const csvString = headers.concat(rows).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `Audit_EWallet_${holder.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!holders || holders.length === 0) {
        return (
            <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-lg">No active e-wallets discovered in the system.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {holders.map((holder) => {
                const isExpanded = expandedWallet === holder.id;
                const activeBalance = (holder.creditBalance || 0) / 100;
                
                return (
                    <div key={holder.id} className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                        {/* Parent Accordion Header */}
                        <div 
                            className="flex flex-col md:flex-row md:items-center justify-between p-6 cursor-pointer hover:bg-gray-50/80 transition-colors"
                            onClick={() => toggleWallet(holder.id)}
                        >
                            <div className="flex items-start md:items-center space-x-6">
                                {/* Visual Tier Badge */}
                                <div className={`p-3 rounded-full hidden md:block ${holder.membershipTier === 'VIP' ? 'bg-purple-100 text-purple-700' : holder.membershipTier === 'GUEST' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <CreditCard size={24} />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900 leading-none">{holder.name || 'Anonymous User'}</h3>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 font-medium">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${holder.membershipTier === 'VIP' ? 'bg-purple-100 text-purple-800' : holder.membershipTier === 'GUEST' ? 'bg-gray-100 text-gray-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {holder.membershipTier}
                                        </span>
                                        <span>•</span>
                                        <span className="font-mono text-xs">{holder.email}</span>
                                        <span>•</span>
                                        <span className="font-mono text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">NRS: {holder.membershipNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 flex items-center justify-between md:space-x-8">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                                    <p className={`text-2xl font-black ${activeBalance > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                        £{activeBalance.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-gray-400 ml-4 p-2 bg-gray-50 rounded-full">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Drill-Down / PCI Audit Panel */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-gray-200 pb-4">
                                    <div className="mb-4 md:mb-0">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                            <ShieldCheck size={18} className="text-emerald-500 mr-2" />
                                            PCI Auditable Ledger History
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Detailed tracing of the last {holder.walletTx?.length || 0} recorded events.</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); downloadReport(holder); }}
                                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-shadow shadow-md hover:shadow-lg text-sm"
                                    >
                                        <Download size={16} />
                                        <span>Export Ledger (CSV)</span>
                                    </button>
                                </div>

                                {(holder.walletTx?.length || 0) === 0 ? (
                                    <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
                                        <Clock size={24} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500">No transaction records generated yet for this E-Wallet.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-inner">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100/50">
                                                <tr>
                                                    <th className="py-3 px-4 font-bold text-gray-600 border-b border-gray-200">Date/Time</th>
                                                    <th className="py-3 px-4 font-bold text-gray-600 border-b border-gray-200">Log Type</th>
                                                    <th className="py-3 px-4 font-bold text-gray-600 border-b border-gray-200">Value</th>
                                                    <th className="py-3 px-4 font-bold text-gray-600 border-b border-gray-200">Ref / Event</th>
                                                    <th className="py-3 px-4 font-bold text-gray-600 border-b border-gray-200 text-right">PCI Audit ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(holder.walletTx || []).map((tx: any) => (
                                                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-emerald-50/50 transition-colors">
                                                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                                                            {format(new Date(tx.createdAt), 'MMM d, yy HH:mm')}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${
                                                                tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                            }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {tx.amount > 0 ? '+' : ''}£{(tx.amount / 100).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate" title={tx.description}>
                                                            {tx.description}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-[10px] text-gray-400 font-mono tracking-tight truncate max-w-[150px]" title={tx.id}>
                                                            {tx.id.substring(tx.id.length - 8)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
