"use client";

import { useEffect, useState } from "react";

export default function LeaderboardsPage() {
    const [disciplines, setDisciplines] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [activeDisc, setActiveDisc] = useState("");
    
    // Log Form
    const [hits, setHits] = useState(0);
    const [total, setTotal] = useState(25);

    useEffect(() => {
        fetchLeaderboard();
    }, [activeDisc]);

    const fetchLeaderboard = async () => {
        const url = activeDisc ? `/api/scores?disciplineId=${activeDisc}` : "/api/scores";
        const r = await fetch(url);
        if (r.ok) {
            const data = await r.json();
            setDisciplines(data.disciplines || []);
            setLeaderboard(data.leaderboard || []);
            if (!activeDisc && data.activeDisciplineId) {
                setActiveDisc(data.activeDisciplineId);
            }
        }
    };

    const submitScore = async () => {
        const r = await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disciplineId: activeDisc, hits, totalTargets: total })
        });
        if (r.ok) {
            alert("Score logged!");
            fetchLeaderboard();
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                Discipline Leaderboards
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Scoring Panel */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Log Activity</h3>
                        <div className="space-y-4">
                            <select 
                                value={activeDisc} 
                                onChange={e => setActiveDisc(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded outline-none"
                            >
                                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Hits</label>
                                    <input type="number" min="0" max={total} value={hits} onChange={e => setHits(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded outline-none" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Total</label>
                                    <input type="number" min="1" value={total} onChange={e => setTotal(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded outline-none" />
                                </div>
                            </div>

                            <button onClick={submitScore} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
                                Submit Drill Score
                            </button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600">Rank</th>
                                    <th className="p-4 font-bold text-slate-600">Shooter</th>
                                    <th className="p-4 font-bold text-slate-600 text-right">Average Hits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaderboard.map((shooter, idx) => (
                                    <tr key={shooter.userId} className={idx === 0 ? "bg-amber-50/50" : "hover:bg-slate-50"}>
                                        <td className="p-4 font-black flex items-center gap-2">
                                            {idx === 0 ? <span className="text-amber-500 text-xl">🥇</span> : 
                                             idx === 1 ? <span className="text-slate-400 text-xl">🥈</span> : 
                                             idx === 2 ? <span className="text-amber-700 text-xl">🥉</span> : 
                                             <span className="text-slate-400">#{idx + 1}</span>}
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800">{shooter.name}</td>
                                        <td className="p-4 text-right font-bold text-indigo-600 tracking-tight">
                                            {shooter.average.toFixed(1)} <span className="text-xs text-slate-400 font-medium">hits/drill</span>
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-slate-500 text-center">No recorded scores for this discipline yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
