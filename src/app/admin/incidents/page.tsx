"use client";

import { useEffect, useState } from "react";

export default function IncidentsReportPage() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [type, setType] = useState("SAFETY_BREACH");
    const [severity, setSeverity] = useState("LOW");
    const [description, setDescription] = useState("");
    const [actionTaken, setActionTaken] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        const r = await fetch("/api/incidents");
        if (r.ok) {
            setIncidents(await r.json());
        }
    };

    const submitIncident = async () => {
        if (!description) return alert("Description is required");
        
        setLoading(true);
        const r = await fetch("/api/incidents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, severity, description, actionTaken })
        });

        if (r.ok) {
            setDescription("");
            setActionTaken("");
            fetchIncidents();
        } else {
            alert("Failed to submit incident.");
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="md:col-span-1 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Safety Logs</h1>
                    <p className="text-slate-600 mb-6">File a new RCO Note or Safety Breach report.</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-4">
                    <select 
                        value={type} 
                        onChange={e => setType(e.target.value)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded outline-none"
                    >
                        <option value="SAFETY_BREACH">Safety Breach</option>
                        <option value="EQUIPMENT_FAULT">Equipment Fault</option>
                        <option value="RCO_NOTE">RCO Note</option>
                    </select>

                    <select 
                        value={severity} 
                        onChange={e => setSeverity(e.target.value)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded outline-none"
                    >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="CRITICAL">Critical Emergency</option>
                    </select>

                    <textarea 
                        placeholder="Description of the incident..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded outline-none resize-none h-24"
                    />

                    <textarea 
                        placeholder="Action taken to resolve..."
                        value={actionTaken}
                        onChange={e => setActionTaken(e.target.value)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded outline-none resize-none h-16"
                    />

                    <button 
                        onClick={submitIncident} 
                        disabled={loading}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Filing Report..." : "Submit Report"}
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="p-4 font-semibold">Incident Details</th>
                                <th className="p-4 font-semibold">Severity & Type</th>
                                <th className="p-4 font-semibold text-right">Date Logged</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {incidents.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-slate-500">No safety incidents on record.</td></tr>
                            )}
                            {incidents.map((inc: any) => (
                                <tr key={inc.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 align-top">
                                        <div className="font-semibold text-slate-800">{inc.reporter?.name}</div>
                                        <div className="text-sm text-slate-600 mt-1">{inc.description}</div>
                                        {inc.actionTaken && (
                                            <div className="text-xs text-slate-500 italic mt-2">Action: {inc.actionTaken}</div>
                                        )}
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wide
                                            ${inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                                              inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {inc.severity}
                                        </span>
                                        <div className="text-xs text-slate-500 font-mono mt-2">{inc.type.replace("_", " ")}</div>
                                    </td>
                                    <td className="p-4 align-top text-right">
                                        <div className="text-sm text-slate-700">
                                            {new Date(inc.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(inc.date).toLocaleTimeString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
