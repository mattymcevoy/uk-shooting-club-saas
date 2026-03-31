"use client";

import { useEffect, useState } from "react";

export default function CoachDashboard() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch("/api/coach-sessions").then(r => r.json()).then(data => {
            if (Array.isArray(data)) setSchedule(data);
        });
    }, []);

    const submitNote = async (memberId: string) => {
        const content = noteDrafts[memberId];
        if (!content) return alert("Note is empty");

        const r = await fetch("/api/coach-sessions/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId, content })
        });

        if (r.ok) {
            alert("Progress note saved!");
            setNoteDrafts(prev => ({ ...prev, [memberId]: "" }));
        } else {
            alert("Failed to save note");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Instructor Dashboard</h1>
            <p className="text-slate-600">Review your upcoming sessions and track member progress.</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                            <th className="p-4 font-semibold">Date & Time</th>
                            <th className="p-4 font-semibold">Student Name</th>
                            <th className="p-4 font-semibold">Progress Notes (Private)</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {schedule.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">No upcoming sessions.</td></tr>
                        )}
                        {schedule.map(sess => (
                            <tr key={sess.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 align-top">
                                    <div className="font-semibold text-slate-700">
                                        {new Date(sess.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="font-semibold text-slate-800">{sess.member.name || "Unknown Member"}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wide">{sess.member.membershipTier}</div>
                                </td>
                                <td className="p-4 align-top">
                                    <textarea 
                                        placeholder="Add private evaluation notes..."
                                        className="w-full text-sm p-3 bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
                                        value={noteDrafts[sess.memberId] || ""}
                                        onChange={(e) => setNoteDrafts(prev => ({ ...prev, [sess.memberId]: e.target.value }))}
                                    />
                                </td>
                                <td className="p-4 align-top text-right">
                                    <button 
                                        onClick={() => submitNote(sess.memberId)}
                                        className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded hover:bg-slate-700 transition"
                                    >
                                        Save Note
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
