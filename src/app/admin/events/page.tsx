'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Target, Plus, MapPin } from 'lucide-react';
import type { Event as PrismaEvent } from '@prisma/client';

export default function AdminEventsPage() {
    const [events, setEvents] = useState<PrismaEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        maxAttendees: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setFormData({ title: '', description: '', date: '', maxAttendees: '' });
                setShowCreate(false);
                fetchEvents();
            }
        } catch (error) {
            console.error('Failed to create event', error);
        }
    };

    if (loading) return <div className="p-8 text-emerald-400">Loading Events...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Event Registration Engine
                    </h1>
                    <p className="text-gray-400 mt-2">Manage open shoots, competitions, and corporate event schedules.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    <Plus size={20} />
                    <span>Create Event</span>
                </button>
            </div>

            {showCreate && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4 text-white">Schedule New Event</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Event Title</label>
                            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                            <input required type="datetime-local" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                            <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Max capacity (Attendees)</label>
                            <input type="number" min="1" value={formData.maxAttendees} onChange={e => setFormData({ ...formData, maxAttendees: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" placeholder="Leave blank for unlimited" />
                        </div>
                        <div className="flex items-end justify-end md:col-span-2">
                            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 py-2.5 rounded-xl transition-all">
                                Publish Event
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        No upcoming events scheduled. Create one to start capturing attendees!
                    </div>
                ) : (
                    events.map(evt => (
                        <div key={evt.id} className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>

                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">{evt.title}</h3>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2 relative z-10">{evt.description || 'Join us for this upcoming shooting event. Tickets available now.'}</p>

                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center text-gray-300 text-sm">
                                    <Calendar size={16} className="text-emerald-500 mr-2" />
                                    {new Date(evt.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center justify-between text-gray-300 text-sm">
                                    <div className="flex items-center">
                                        <Users size={16} className="text-emerald-500 mr-2" />
                                        0 / {evt.maxAttendees || 'Unlimited'} Enrolled
                                    </div>
                                    <button className="text-emerald-400 text-xs font-bold hover:underline">View Leads</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
