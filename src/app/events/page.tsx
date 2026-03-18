'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, ArrowRight, ShieldAlert, CreditCard, X, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function PublicEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userBalance, setUserBalance] = useState<number>(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Modal State
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [paymentMode, setPaymentMode] = useState<'FULL' | 'DEPOSIT'>('FULL');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    useEffect(() => {
        fetchEvents();
        checkUserStatus();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    const checkUserStatus = async () => {
        try {
            const res = await fetch('/api/user/me');
            if (res.ok) {
                const data = await res.json();
                setIsLoggedIn(true);
                setUserBalance(data.user?.creditBalance || 0);
            }
        } catch (e) {
            // Not logged in
            setIsLoggedIn(false);
        }
    };

    const openModal = (evt: any) => {
        setSelectedEvent(evt);
        setPaymentMode('FULL');
        setRegistrationSuccess(false);
    };

    const closeModal = () => {
        setSelectedEvent(null);
        setRegistrationSuccess(false);
    };

    const handleRegistration = async () => {
        if (!selectedEvent) return;
        setIsRegistering(true);

        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: selectedEvent.id, paymentType: paymentMode })
            });

            if (res.ok) {
                setRegistrationSuccess(true);
                // Refresh balance and events
                checkUserStatus();
                fetchEvents();
            } else {
                const err = await res.json();
                if (res.status === 402) {
                    // Redirect to topup if insufficient funds
                    window.location.href = '/dashboard?wallet=topup-required';
                } else {
                    alert(err.error || 'Failed to register.');
                }
            }
        } catch (e) {
            console.error('Registration error', e);
            alert('An unexpected error occurred.');
        } finally {
            setIsRegistering(false);
        }
    };

    const requiredAmount = selectedEvent ? (paymentMode === 'FULL' ? selectedEvent.entryFee : Math.ceil(selectedEvent.entryFee * 0.25)) : 0;
    const hasSufficientFunds = userBalance >= requiredAmount;

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white">
            {/* Header */}
            <div className="w-full bg-black/50 backdrop-blur-md sticky top-0 z-40 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Club Events
                    </h1>
                    {isLoggedIn ? (
                        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                            <CreditCard size={16} className="text-emerald-500" />
                            <span className="font-bold text-sm tracking-widest text-emerald-400">£{(userBalance / 100).toFixed(2)}</span>
                        </div>
                    ) : (
                        <a href="/auth/signin" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign In</a>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Upcoming Fixtures</h2>
                    <p className="text-lg text-gray-400">Join our scheduled competitions, claymate sessions, and hospitality days. Secure your spot using your E-Wallet.</p>
                </div>

                {loading ? (
                    <div className="text-center text-emerald-500 animate-pulse font-bold text-lg">Loading Directory...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                                No upcoming events are currently scheduled. Please check back later.
                            </div>
                        ) : (
                            events.map(evt => (
                                <div key={evt.id} className="bg-gradient-to-br from-black to-gray-900 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all flex flex-col h-full group">
                                    <div className="p-8 flex-grow space-y-5">
                                        <div className="flex justify-between items-start">
                                            <div className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                                {evt.eventType.replace('_', ' ')}
                                            </div>
                                            <div className="text-xl font-bold font-mono">
                                                £{(evt.entryFee / 100).toFixed(2)}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold leading-tight group-hover:text-emerald-400 transition-colors">{evt.title}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{evt.description}</p>

                                        <div className="grid grid-cols-2 gap-3 pt-2 text-sm font-medium text-gray-300">
                                            <div className="flex items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                                <Calendar size={14} className="mr-2 text-emerald-500 shrink-0" />
                                                <span className="truncate">{new Date(evt.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                                <Users size={14} className="mr-2 text-emerald-500 shrink-0" />
                                                <span>{evt.currentAttendees} / {evt.maxAttendees || '∞'}</span>
                                            </div>
                                            {evt.signInTime && (
                                                <div className="col-span-2 flex items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                                    <Clock size={14} className="mr-2 text-emerald-500 shrink-0" />
                                                    <span>Sign-in at {new Date(evt.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 border-t border-white/10 mt-auto">
                                        <button
                                            onClick={() => openModal(evt)}
                                            disabled={evt.maxAttendees && evt.currentAttendees >= evt.maxAttendees}
                                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all bg-white text-black hover:bg-emerald-500 hover:text-white disabled:bg-gray-800 disabled:text-gray-500"
                                        >
                                            <span>
                                                {evt.maxAttendees && evt.currentAttendees >= evt.maxAttendees ? 'Sold Out' : 'Register Now'}
                                            </span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold">Secure Your Spot</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {!isLoggedIn ? (
                            <div className="p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldAlert size={32} className="text-emerald-500" />
                                </div>
                                <h4 className="text-xl font-bold">Sign In Required</h4>
                                <p className="text-gray-400 text-sm">You must be logged into your account to use your E-Wallet and reserve tickets.</p>
                                <a href="/auth/signin" className="block w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">
                                    Go to Login
                                </a>
                            </div>
                        ) : registrationSuccess ? (
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                    <CheckCircle size={40} className="text-emerald-500" />
                                </div>
                                <h4 className="text-2xl font-black text-white">Registration Confirmed!</h4>
                                <p className="text-emerald-400 font-bold mb-2">{selectedEvent.title}</p>
                                <p className="text-gray-400 text-sm">Your E-Wallet has been charged and your booking is safely stored. Present your dashboard QR code upon arrival to check-in.</p>
                                <button onClick={closeModal} className="w-full py-4 mt-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                                    Back to Directory
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{selectedEvent.title}</h4>
                                    <div className="text-gray-400 text-sm flex items-center">
                                        <Calendar size={14} className="mr-2" />
                                        {new Date(selectedEvent.date).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Booking Options */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Options</label>

                                    <div
                                        onClick={() => setPaymentMode('FULL')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMode === 'FULL' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/40 hover:border-white/20'}`}
                                    >
                                        <div>
                                            <div className="font-bold text-white">Full Entry Fee</div>
                                            <div className="text-sm text-gray-400">Pay the entire balance now.</div>
                                        </div>
                                        <div className="text-lg font-bold font-mono text-emerald-400">£{(selectedEvent.entryFee / 100).toFixed(2)}</div>
                                    </div>

                                    <div
                                        onClick={() => setPaymentMode('DEPOSIT')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMode === 'DEPOSIT' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/40 hover:border-white/20'}`}
                                    >
                                        <div>
                                            <div className="font-bold text-white">25% Deposit</div>
                                            <div className="text-sm text-gray-400">Secure spot, pay rest later.</div>
                                        </div>
                                        <div className="text-lg font-bold font-mono text-emerald-400">£{((selectedEvent.entryFee * 0.25) / 100).toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Wallet Check */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center text-sm">
                                        <CreditCard size={18} className="text-gray-400 mr-3" />
                                        <span className="text-gray-300">Wallet Balance</span>
                                    </div>
                                    <div className={`font-bold font-mono ${hasSufficientFunds ? 'text-white' : 'text-red-400'}`}>
                                        £{(userBalance / 100).toFixed(2)}
                                    </div>
                                </div>

                                {/* Cancellation Notices */}
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <h5 className="flex items-center text-red-500 font-bold text-xs uppercase mb-2">
                                        <ShieldAlert size={14} className="mr-2" /> Cancellation Policy
                                    </h5>
                                    <p className="text-xs text-red-200/70 mb-2 leading-relaxed">
                                        Strict 48-hour cancellation notice applies. Non-attendance without cancellation results in forfeiture of fees.
                                    </p>
                                    <ul className="text-xs text-red-200/50 space-y-1 list-disc pl-4">
                                        <li><strong>Non-Members:</strong> 100% loss of fee/deposit.</li>
                                        <li><strong>Members:</strong> Loss of deposit, or 50% loss if full fee paid.</li>
                                    </ul>
                                </div>

                                {/* Actions */}
                                <div className="pt-2">
                                    {hasSufficientFunds ? (
                                        <button
                                            onClick={handleRegistration}
                                            disabled={isRegistering}
                                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition-all flex justify-center items-center shadow-lg shadow-emerald-500/20"
                                        >
                                            {isRegistering ? 'Processing...' : `Confirm & Pay £${(requiredAmount / 100).toFixed(2)}`}
                                        </button>
                                    ) : (
                                        <a href="/dashboard?wallet=topup-required" className="flex w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-bold rounded-xl transition-all justify-center items-center">
                                            Add Funds to Wallet
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
