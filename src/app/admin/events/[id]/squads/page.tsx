'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, AlertCircle, Save, Edit2, X } from 'lucide-react';

export default function SquadManagementPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [editingSquad, setEditingSquad] = useState<{ id: string, name: string, maxCapacity: number, startTime: string | null, startingTrap: string | null } | null>(null);
    const [editingShooter, setEditingShooter] = useState<{ id: string, attendeeName: string, startStand: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/squads`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data.event);
                setBookings(data.bookings || []);
            } else {
                setError('Failed to load event data. Make sure it exists.');
            }
        } catch (err) {
            console.error('Fetch err', err);
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSquad = async (bookingId: string, newSquadId: string) => {
        setSaving(bookingId);
        setError('');

        try {
            const res = await fetch(`/api/admin/events/${eventId}/squads`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, squadId: newSquadId || null })
            });

            if (res.ok) {
                // Update local state without full refetch
                setBookings(prev => prev.map(b =>
                    b.id === bookingId ? { ...b, squadId: newSquadId || null } : b
                ));
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to assign squad');
            }
        } catch (err) {
            setError('A network error occurred while assigning squad.');
        } finally {
            setSaving(null);
        }
    };

    const formatTimeForInput = (timeString: string | null) => {
        if (!timeString) return '';
        try {
            // First check if it's already a valid HH:MM string
            if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;

            // Otherwise, try to parse it as an ISO date string
            const date = new Date(timeString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().substring(11, 16);
        } catch {
            return '';
        }
    };

    const handleUpdateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving('squad-update');
        setError('');

        try {
            const res = await fetch(`/api/admin/events/${eventId}/squads/${editingSquad!.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSquad)
            });

            if (res.ok) {
                const updatedSquad = await res.json();
                setEvent((prev: any) => ({
                    ...prev,
                    squads: prev.squads.map((s: any) => s.id === updatedSquad.id ? updatedSquad : s)
                }));
                setEditingSquad(null);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to update squad');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setSaving(null);
        }
    };

    const handleSaveShooter = async () => {
        if (!editingShooter) return;
        setSaving(editingShooter.id);
        setError('');

        try {
            const res = await fetch(`/api/admin/bookings/${editingShooter.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendeeName: editingShooter.attendeeName,
                    startStand: editingShooter.startStand
                })
            });

            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === editingShooter.id ? {
                    ...b,
                    attendeeName: editingShooter.attendeeName,
                    startStand: editingShooter.startStand
                } : b));
                setEditingShooter(null);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to update shooter details');
            }
        } catch (err) {
            setError('A network error occurred while updating the shooter.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8 text-emerald-400">Loading Squads...</div>;
    if (!event) return <div className="p-8 text-red-400">{error || 'Event not found'}</div>;

    // Use real squads array
    const squads = event.squads || [];

    // Generate squad fullness array for UI
    const getSquadOccupancy = (sqId: string) => {
        return bookings.filter(b => b.squadId === sqId).length;
    };

    const renderShooterRow = (booking: any, idx: number, isUnassigned = false) => {
        const isEditingThisShooter = editingShooter?.id === booking.id;

        return (
            <div key={booking.id} className={`flex items-center justify-between text-sm group ${isUnassigned ? 'bg-white/5 border border-white/10 p-4 rounded-xl mb-3' : 'py-2'}`}>
                {isEditingThisShooter ? (
                    <div className="flex items-center space-x-2 flex-grow mr-4">
                        <input
                            type="text"
                            value={editingShooter!.attendeeName}
                            onChange={e => setEditingShooter({ ...editingShooter!, attendeeName: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-white text-xs w-1/2 focus:outline-emerald-500"
                            placeholder="Shooter Name"
                        />
                        <input
                            type="text"
                            value={editingShooter!.startStand}
                            onChange={e => setEditingShooter({ ...editingShooter!, startStand: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-white text-xs w-1/4 focus:outline-emerald-500"
                            placeholder="Shooter No."
                        />
                        <button
                            onClick={handleSaveShooter}
                            disabled={saving === booking.id}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold shrink-0"
                        >
                            {saving === booking.id ? '...' : 'Save'}
                        </button>
                        <button
                            onClick={() => setEditingShooter(null)}
                            className="text-gray-500 hover:text-gray-300 text-xs shrink-0"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center text-gray-300 flex-grow overflow-hidden">
                        {!isUnassigned && <span className="w-6 text-gray-500 text-xs text-right mr-3 shrink-0">{booking.startStand || idx + 1}.</span>}
                        {isUnassigned && booking.startStand && <span className="text-gray-500 text-xs border border-white/10 px-1.5 py-0.5 rounded mr-3 shrink-0">No. {booking.startStand}</span>}
                        <div className="min-w-0 flex flex-col items-start md:flex-row md:items-center">
                            <span className="font-medium text-white group-hover:text-emerald-400 transition-colors truncate uppercase mr-2 text-base">
                                {booking.attendeeName || booking.user.name}
                            </span>
                            <span className="text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold mt-1 md:mt-0">
                                {booking.user.membershipTier.split('_')[0]}
                            </span>
                        </div>
                    </div>
                )}

                <div className={`flex items-center space-x-3 ${!isUnassigned ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                    {!isEditingThisShooter && (
                        <button
                            onClick={() => setEditingShooter({
                                id: booking.id,
                                attendeeName: booking.attendeeName || booking.user.name || '',
                                startStand: booking.startStand || ''
                            })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 font-bold"
                        >
                            Edit
                        </button>
                    )}
                    {isUnassigned ? (
                        <select
                            disabled={saving === booking.id || isEditingThisShooter}
                            value=""
                            onChange={(e) => handleAssignSquad(booking.id, e.target.value)}
                            className="bg-black/50 border border-emerald-500/30 text-emerald-400 rounded-lg px-2 py-1.5 text-xs focus:ring-emerald-500 outline-none w-32 shrink-0 font-bold cursor-pointer"
                        >
                            <option value="" disabled>Assign Squad...</option>
                            {squads.map((sq: any) => (
                                <option key={sq.id} value={sq.id} disabled={getSquadOccupancy(sq.id) >= sq.maxCapacity} className="text-white bg-gray-900">
                                    {sq.name} {getSquadOccupancy(sq.id) >= sq.maxCapacity ? '(FULL)' : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <button
                            disabled={saving === booking.id || isEditingThisShooter}
                            onClick={() => handleAssignSquad(booking.id, '')}
                            className={`text-xs text-red-400 hover:text-red-300 shrink-0 font-bold ${isEditingThisShooter ? 'hidden' : ''}`}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/admin/events')}
                        className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Back to Events
                    </button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Squad Allocations
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg font-medium">{event.title}</p>
                </div>

                <div className="flex space-x-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-400 mb-1">Total Assigned</div>
                        <div className="text-xl font-bold text-white">
                            {bookings.filter(b => b.squadId).length} <span className="text-gray-500 text-sm">/ {bookings.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center">
                    <AlertCircle size={20} className="mr-3 shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Unassigned List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Users size={20} className="mr-2 text-emerald-500" />
                        Unassigned Attendees
                    </h2>

                    {bookings.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                            No attendees registered yet.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {bookings.filter(b => !b.squadId).map((booking, idx) => renderShooterRow(booking, idx, true))}
                            {bookings.filter(b => !b.squadId).length === 0 && bookings.length > 0 && (
                                <div className="text-gray-500 text-sm italic">All attendees assigned.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Allocated Squads Grid */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Configured Squads</h2>

                    <div className="space-y-6">
                        {squads.map((sq: any) => {
                            const squadMembers = bookings.filter(b => b.squadId === sq.id);
                            const isFull = squadMembers.length >= sq.maxCapacity;

                            return (
                                <div key={sq.id} className={`border rounded-xl p-4 transition-colors relative ${isFull ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                                    {editingSquad?.id === sq.id ? (
                                        <form onSubmit={handleUpdateSquad} className="space-y-4 mb-4 border-b border-white/10 pb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-400">Editing: {sq.name}</h3>
                                                <button type="button" onClick={() => setEditingSquad(null)} className="text-gray-400 hover:text-white">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Squad Name</label>
                                                    <input
                                                        type="text"
                                                        value={editingSquad!.name}
                                                        onChange={e => setEditingSquad({ ...editingSquad!, name: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Max Capacity</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={editingSquad!.maxCapacity}
                                                        onChange={e => setEditingSquad({ ...editingSquad!, maxCapacity: parseInt(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Start Time (Optional)</label>
                                                    <input
                                                        type="time"
                                                        value={formatTimeForInput(editingSquad!.startTime)}
                                                        onChange={e => setEditingSquad({ ...editingSquad!, startTime: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Starting Trap (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={editingSquad!.startingTrap || ''}
                                                        onChange={e => setEditingSquad({ ...editingSquad!, startingTrap: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                                        placeholder="e.g. Trap 1"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={saving === 'squad-update'}
                                                className="w-full bg-emerald-500 text-black font-bold py-2 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                            >
                                                {saving === 'squad-update' ? 'Saving...' : 'Save Configuration'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-bold text-lg text-white">{sq.name}</h3>
                                                <button onClick={() => setEditingSquad({ ...sq, startingTrap: sq.startingTrap || '' })} className="text-gray-500 hover:text-emerald-400 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                {sq.startTime && (
                                                    <span className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-4">
                                                        {new Date(sq.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {sq.startingTrap && (
                                                    <span className="text-xs text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase font-black">
                                                        Trap: {sq.startingTrap}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isFull ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                                                {squadMembers.length} / {sq.maxCapacity} Filled
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {squadMembers.map((booking, idx) => renderShooterRow(booking, idx, false))}
                                        {squadMembers.length === 0 && (
                                            <div className="text-gray-500 text-sm italic py-2">Empty squad</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
