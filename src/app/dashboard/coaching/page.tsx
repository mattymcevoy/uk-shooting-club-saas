"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberCoachingPage() {
    const router = useRouter();
    const [coaches, setCoaches] = useState<any[]>([]);
    const [selectedCoach, setSelectedCoach] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/users/coaches")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCoaches(data);
            });
    }, []);

    const handleBook = async () => {
        if (!selectedCoach || !selectedDate || !selectedTime) return alert("Fill all fields");
        
        setLoading(true);
        const startTime = new Date(`${selectedDate}T${selectedTime}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hr session
        
        const r = await fetch("/api/coach-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coachId: selectedCoach, startTime, endTime })
        });
        
        if (r.ok) {
            alert("Coach session booked successfully!");
            router.push("/dashboard");
        } else {
            const err = await r.json();
            alert(`Error: ${err.error}`);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Book a Coaching Session</h1>
            <p className="text-slate-600">Select an official club instructor to rapidly improve your disciplines.</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Instructor</label>
                    <select 
                        value={selectedCoach} 
                        onChange={e => setSelectedCoach(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">-- Select Instructor --</option>
                        {coaches.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                        <input 
                            type="time"
                            value={selectedTime}
                            onChange={e => setSelectedTime(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleBook}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 transition text-white font-bold rounded-lg disabled:opacity-50"
                >
                    {loading ? "Booking in progress..." : "Confirm Booking"}
                </button>
            </div>
        </div>
    );
}
