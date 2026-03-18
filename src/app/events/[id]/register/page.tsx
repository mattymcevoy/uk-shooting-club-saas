'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Mail, Phone, ArrowLeft, Target, Plus, Minus, Users, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function EventRegistrationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const eventId = params.id;
    const { data: session, status } = useSession();

    const [themeColor, setThemeColor] = useState('#10b981');
    const [clubName, setClubName] = useState('Shooting Club');

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Default form data
    const [tickets, setTickets] = useState([{ attendeeName: '', squadId: '' }]);
    const [paymentType, setPaymentType] = useState('FULL');

    useEffect(() => {
        if (status === 'authenticated' && session.user?.name && tickets[0].attendeeName === '') {
            setTickets([{ attendeeName: session.user.name, squadId: '' }]);
        }
    }, [status, session]);

    useEffect(() => {
        const fetchBrandAndEvent = async () => {
            try {
                // Fetch Brand Settings
                const resBrand = await fetch('/api/admin/settings');
                const dataBrand = await resBrand.json();
                if (dataBrand.themeColor) setThemeColor(dataBrand.themeColor);
                if (dataBrand.name) setClubName(dataBrand.name);

                // Fetch Event Details
                const resEvent = await fetch(`/api/events/${eventId}`);
                if (resEvent.ok) {
                    const dataEvent = await resEvent.json();
                    setEvent(dataEvent);
                } else {
                    throw new Error('Event not found');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBrandAndEvent();
    }, [eventId]);

    const addTicket = () => {
        if (tickets.length < 12) {
            setTickets([...tickets, { attendeeName: `Guest ${tickets.length}`, squadId: '' }]);
        }
    };

    const removeTicket = (index: number) => {
        if (tickets.length > 1) {
            setTickets(tickets.filter((_, i) => i !== index));
        }
    };

    const updateTicket = (index: number, field: string, value: string) => {
        const newTickets = [...tickets];
        newTickets[index] = { ...newTickets[index], [field]: value };
        setTickets(newTickets);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    paymentType,
                    tickets
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            router.push(`/dashboard?event_success=true`);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to register. Please try again.');
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]"><Target className="animate-spin text-emerald-500" size={48} /></div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center text-white bg-[#0B0F19]">Event not found.</div>;

    const isPaidMember = (session?.user as any)?.membershipTier && (session?.user as any).membershipTier !== 'NONE';
    const totalFee = paymentType === 'FULL' ? event.entryFee * tickets.length : Math.ceil(event.entryFee * 0.25) * tickets.length;

    // Helper to calculate 45 mins before Start Time
    const getRegistrationTime = (startTime: string) => {
        if (!startTime) return 'Determined by Organizer';
        const d = new Date(startTime);
        d.setMinutes(d.getMinutes() - 45);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 relative">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Event Header */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: themeColor }}></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, white, ${themeColor})` }}>
                                {event.title}
                            </h1>
                            <div className="flex items-center text-gray-400 mt-3 space-x-4">
                                <span className="flex items-center"><Calendar size={16} className="mr-2" /> {new Date(event.date).toLocaleDateString()}</span>
                                <span className="flex items-center"><Target size={16} className="mr-2" /> {event.eventType.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">£{(event.entryFee / 100).toFixed(2)}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Per Person</div>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Tickets Breakdown */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold flex items-center"><Users className="mr-3 text-emerald-500" /> Attendee Configuration</h2>
                            <div className="text-sm bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                                {tickets.length} / 12 Tickets
                            </div>
                        </div>

                        <div className="space-y-4">
                            {tickets.map((ticket, index) => (
                                <div key={index} className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors relative">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTicket(index)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                    )}

                                    <h3 className="font-bold text-gray-300 mb-4">Ticket #{index + 1} {index === 0 ? '(You)' : '(Guest)'}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Attendee Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={ticket.attendeeName}
                                                onChange={e => updateTicket(index, 'attendeeName', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500 transition-colors"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        {isPaidMember ? (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Select Squad</label>
                                                <select
                                                    value={ticket.squadId}
                                                    onChange={e => updateTicket(index, 'squadId', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-emerald-500 transition-colors appearance-none"
                                                >
                                                    <option value="">Auto-Assign (Any)</option>
                                                    {event.squads?.map((sq: any) => (
                                                        <option key={sq.id} value={sq.id}>{sq.name}</option>
                                                    ))}
                                                </select>

                                                {/* Calculate Registration Time if a squad is explicitly picked. */}
                                                {ticket.squadId && event.squads?.find((s: any) => s.id === ticket.squadId)?.startTime && (
                                                    <div className="mt-2 flex items-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                                                        <Clock size={12} className="mr-1.5 shrink-0" />
                                                        Registration Opens: {getRegistrationTime(event.squads.find((s: any) => s.id === ticket.squadId).startTime)}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col justify-center">
                                                <div className="text-xs text-gray-500 p-3 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                    Squad selection is reserved for Paid Members. Auto-assignment applies.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {tickets.length < 12 && (
                            <button
                                type="button"
                                onClick={addTicket}
                                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center font-bold"
                            >
                                <Plus size={20} className="mr-2 text-emerald-500" /> Add Another Ticket
                            </button>
                        )}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold flex items-center">Checkout Summary</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white/5" style={{ borderColor: paymentType === 'FULL' ? themeColor : 'rgba(255,255,255,0.1)' }}>
                                <div className="flex items-center">
                                    <input type="radio" checked={paymentType === 'FULL'} onChange={() => setPaymentType('FULL')} className="mr-4 hidden" />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${paymentType === 'FULL' ? 'border-emerald-500' : 'border-gray-500'}`}>
                                        {paymentType === 'FULL' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">Pay in Full</div>
                                        <div className="text-sm text-gray-500">Secure all tickets directly from your wallet balance.</div>
                                    </div>
                                </div>
                                <div className="font-bold text-xl">£{((event.entryFee * tickets.length) / 100).toFixed(2)}</div>
                            </label>

                            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-white/5" style={{ borderColor: paymentType === 'DEPOSIT' ? themeColor : 'rgba(255,255,255,0.1)' }}>
                                <div className="flex items-center">
                                    <input type="radio" checked={paymentType === 'DEPOSIT'} onChange={() => setPaymentType('DEPOSIT')} className="mr-4 hidden" />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${paymentType === 'DEPOSIT' ? 'border-emerald-500' : 'border-gray-500'}`}>
                                        {paymentType === 'DEPOSIT' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">25% Deposit</div>
                                        <div className="text-sm text-gray-500">Pay the remainder on the day of the shoot.</div>
                                    </div>
                                </div>
                                <div className="font-bold text-xl">£{((Math.ceil(event.entryFee * 0.25) * tickets.length) / 100).toFixed(2)}</div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between bg-black/50 p-6 rounded-2xl mb-8">
                            <div className="text-gray-400">Total Deducted (Credits)</div>
                            <div className="text-3xl font-bold" style={{ color: themeColor }}>£{(totalFee / 100).toFixed(2)}</div>
                        </div>

                        <button
                            disabled={processing}
                            type="submit"
                            className="w-full py-4 rounded-xl font-bold text-center transition-all disabled:opacity-50 hover:brightness-110 shadow-lg text-lg uppercase tracking-wider"
                            style={{ backgroundColor: themeColor, color: '#0B0F19' }}
                        >
                            {processing ? 'Processing Transaction...' : 'Confirm & Purchase Tickets'}
                        </button>

                        <div className="text-center mt-6 text-xs text-gray-500 space-y-1">
                            <p>Cancellation within 48 hours of the event will forfeit any deposits paid.</p>
                            <p>Full members may be eligible for partial refunds per club terms.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
