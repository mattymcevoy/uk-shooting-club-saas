'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Plus, UserPlus, Clock, Edit2 } from 'lucide-react';
import type { Event as PrismaEvent } from '@prisma/client';
import Link from 'next/link';

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        signInTime: '',
        startTime: '',
        maxAttendees: '',
        eventType: 'COMPETITION',
        entryFee: '',
        squadCount: '1',
        maxPerSquad: '6'
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/admin/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(Array.isArray(data) ? data : []);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Failed to load events', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) {
            alert('Please enter an Event Title.');
            return;
        }
        if (!formData.date) {
            alert('Please select an Event Date.');
            return;
        }

        try {
            const url = '/api/admin/events';
            const method = editingEventId ? 'PUT' : 'POST';
            const body = {
                ...formData,
                id: editingEventId,
                entryFee: formData.entryFee ? parseFloat(formData.entryFee) * 100 : 0 // Convert £ to pennies
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setFormData({
                    title: '', description: '', date: '', signInTime: '', startTime: '', maxAttendees: '', eventType: 'COMPETITION', entryFee: '', squadCount: '1', maxPerSquad: '6'
                });
                setShowCreate(false);
                setEditingEventId(null);
                fetchEvents();
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error || 'Failed to create event'}`);
            }
        } catch (error) {
            console.error('Failed to create event', error);
            alert('An unexpected network error occurred while publishing.');
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
                    <p className="text-gray-400 mt-2">Manage competitions, coaching, and corporate events.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEventId(null);
                        setFormData({ title: '', description: '', date: '', signInTime: '', startTime: '', maxAttendees: '', eventType: 'COMPETITION', entryFee: '', squadCount: '1', maxPerSquad: '6' });
                        setShowCreate(!showCreate);
                    }}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    <Plus size={20} />
                    <span>{showCreate && !editingEventId ? 'Close Form' : 'Create Event'}</span>
                </button>
            </div>

            {showCreate && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4 text-white">{editingEventId ? 'Edit Event' : 'Schedule New Event'}</h2>
                    <form onSubmit={handleCreate} noValidate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Event Title</label>
                            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Event Type</label>
                            <select value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-emerald-500 outline-none appearance-none">
                                <option value="COMPETITION">Competition</option>
                                <option value="CLAYMATE">Claymate</option>
                                <option value="CORPORATE_EVENT">Corporate Event</option>
                                <option value="RESTAURANT">Restaurant</option>
                                <option value="SHOPPING_EVENT">Shopping Event</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Date</label>
                            <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Sign-in Time</label>
                            <input type="time" value={formData.signInTime} onChange={e => setFormData({ ...formData, signInTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                            <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                            <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none resize-none" />
                        </div>

                        <div className="lg:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Max Capacity (Attendees)</label>
                            <input type="number" min="1" value={formData.maxAttendees} onChange={e => setFormData({ ...formData, maxAttendees: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" placeholder="Leave blank for unlimited" />
                        </div>

                        <div className="lg:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Entry Fee (£)</label>
                            <input type="number" step="0.01" min="0" value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" placeholder="0.00" />
                        </div>

                        <div className="lg:col-span-1" />

                        <div className="lg:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Number of Squads</label>
                            <input type="number" min="1" value={formData.squadCount} onChange={e => setFormData({ ...formData, squadCount: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div className="lg:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Max Persons per Squad</label>
                            <input type="number" min="1" value={formData.maxPerSquad} onChange={e => setFormData({ ...formData, maxPerSquad: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-emerald-500 outline-none" />
                        </div>

                        <div className="flex items-end justify-end">
                            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 py-2.5 rounded-xl transition-all">
                                {editingEventId ? 'Save Changes' : 'Publish Event'}
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
                        <div key={evt.id} className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors flex flex-col h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{evt.title}</h3>
                                    <div className="inline-flex text-xs font-bold bg-white/10 text-gray-300 px-2 py-1 rounded-md whitespace-nowrap">
                                        {evt.eventType.replace('_', ' ')}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingEventId(evt.id);
                                        setFormData({
                                            title: evt.title,
                                            description: evt.description || '',
                                            date: new Date(evt.date).toISOString().split('T')[0],
                                            signInTime: evt.signInTime ? new Date(evt.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                                            startTime: evt.startTime ? new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                                            maxAttendees: evt.maxAttendees ? evt.maxAttendees.toString() : '',
                                            eventType: evt.eventType,
                                            entryFee: (evt.entryFee / 100).toString(),
                                            squadCount: evt._count?.squads?.toString() || '1',
                                            maxPerSquad: evt.maxPerSquad?.toString() || '6',
                                        });
                                        setShowCreate(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    title="Edit Event"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mb-6 line-clamp-2 relative z-10 flex-grow">{evt.description || 'Join us for this upcoming shooting event. Tickets available now.'}</p>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5 relative z-10 mb-4">
                                <div className="flex items-center">
                                    <Calendar size={14} className="text-emerald-500 mr-2 shrink-0" />
                                    <span className="truncate">{new Date(evt.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-bold text-emerald-400 mr-1.5">£</span>
                                    {(evt.entryFee / 100).toFixed(2)}
                                </div>
                                {evt.signInTime && (
                                    <div className="flex items-center">
                                        <UserPlus size={14} className="text-emerald-500 mr-2 shrink-0" />
                                        Sing-in: {new Date(evt.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                                {evt.startTime && (
                                    <div className="flex items-center">
                                        <Clock size={14} className="text-emerald-500 mr-2 shrink-0" />
                                        Start: {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-gray-300 text-sm border-t border-white/10 pt-4 relative z-10">
                                <div className="flex items-center">
                                    <Users size={16} className="text-emerald-500 mr-2" />
                                    <span className="font-bold text-white">{evt._count?.bookings || 0}</span> / {evt.maxAttendees || '∞'} Enrolled
                                </div>
                                <Link
                                    href={`/admin/events/${evt.id}/squads`}
                                    className="text-emerald-400 text-xs font-bold hover:underline px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                                >
                                    Manage Squads &rarr;
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
