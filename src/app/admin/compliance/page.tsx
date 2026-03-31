"use client";

import { useEffect, useState } from "react";

export default function ComplianceAdminPage() {
    const [records, setRecords] = useState<any[]>([]);
    
    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        const r = await fetch("/api/compliance");
        if (r.ok) {
            setRecords(await r.json());
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Are you sure you want to approve this document and mark the member as compliant?")) return;
        
        const r = await fetch(`/api/compliance/${id}/approve`, { method: "POST" });
        if (r.ok) {
            fetchRecords(); // Refresh
        } else {
            alert("Failed to approve.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    Compliance Center
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    Monitor expiring licenses and approve newly uploaded credentials.
                </p>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-gray-500/30 overflow-hidden">
                <table className="w-full text-left border-collapse text-white">
                    <thead>
                        <tr className="bg-white/5 border-b border-gray-500/30 text-gray-300 text-sm">
                            <th className="p-4 font-semibold">Member</th>
                            <th className="p-4 font-semibold">Document Type</th>
                            <th className="p-4 font-semibold">Expiration Date</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {records.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No compliance records found.</td></tr>
                        )}
                        {records.map((rec) => {
                            const daysUntilExpiry = Math.ceil((new Date(rec.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                            const isExpired = daysUntilExpiry < 0;

                            return (
                                <tr key={rec.id} className="hover:bg-white/5 transition">
                                    <td className="p-4 font-semibold">{rec.user.name || "Unknown"}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-white/10 rounded font-mono text-xs">{rec.type}</span></td>
                                    <td className="p-4">
                                        <div>{new Date(rec.expiryDate).toLocaleDateString()}</div>
                                        {isExpired ? (
                                            <div className="text-xs text-red-400 font-bold mt-1">EXPIRED!</div>
                                        ) : daysUntilExpiry <= 30 ? (
                                            <div className="text-xs text-orange-400 font-bold mt-1">Expires in {daysUntilExpiry} days</div>
                                        ) : (
                                            <div className="text-xs text-green-400 font-bold mt-1">Valid ({daysUntilExpiry} days left)</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {rec.isApproved ? (
                                            <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">✅ Approved</span>
                                        ) : (
                                            <span className="text-yellow-400 text-sm font-bold">Pending Review</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!rec.isApproved && (
                                            <button 
                                                onClick={() => handleApprove(rec.id)}
                                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 font-semibold rounded transition"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {rec.documentUrl && (
                                            <a href={rec.documentUrl} target="_blank" rel="noreferrer" className="ml-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 font-semibold rounded transition">
                                                View PDF
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
