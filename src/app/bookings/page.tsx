'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

type Facility = {
    id: string;
    name: string;
    capacity: number;
    baseRate: number;
    memberRate: number;
};

export default function MemberBookingsPortal() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [bookingStatus, setBookingStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
    const [bookingData, setBookingData] = useState<{ id: string; qrHash: string } | null>(null);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const res = await fetch('/api/facilities');
            if (res.ok) {
                const data = await res.json();
                const active = data.filter((f: any) => f.isActive);
                setFacilities(active);
                if (active.length > 0) setSelectedFacility(active[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [membershipNumber, setMembershipNumber] = useState('');
    
    // Auto-lookup hook triggers
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [renewalWarning, setRenewalWarning] = useState('');

    useEffect(() => {
        const performLookup = async () => {
            if (name.length > 3 && phone.length > 5 && email.includes('@')) {
                setIsLookingUp(true);
                try {
                    const res = await fetch('/api/members/lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone, email })
                    });
                    const data = await res.json();
                    
                    if (data.found && data.user.membershipNumber) {
                        setMembershipNumber(data.user.membershipNumber);
                        
                        if (data.user.isExpired) {
                            setRenewalWarning("Your membership has expired. We have just emailed you a renewal link!");
                        } else {
                            setRenewalWarning('');
                        }
                    }
                } catch (e) {
                    // silently fail the auto-lookup
                } finally {
                    setIsLookingUp(false);
                }
            }
        };

        const timeout = setTimeout(performLookup, 1000);
        return () => clearTimeout(timeout);
    }, [name, phone, email]);

    const verifyManualMembership = async (forcedMemNum: string) => {
        if (!forcedMemNum) return;
        try {
            const res = await fetch('/api/members/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membershipNumber: forcedMemNum })
            });
            const data = await res.json();
            
            if (data.found && data.user.isExpired) {
                setRenewalWarning("Your membership has expired. We have just emailed you a renewal link!");
            } else {
                setRenewalWarning('');
            }
        } catch(e) {}
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingStatus(null);
        if (!name || !email || !date || !time || !selectedFacility) return;

        // Using an ephemeral MOCK_USER_ID if they don't have a login
        const MOCK_USER_ID = 'cmh5g2n6k0000dummy1234';

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1); // 1 hour slots default

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    phone,
                    facilityId: selectedFacility,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    attendeeName: name 
                }),
            });

            if (res.ok) {
                const data = await res.json();

                // Store the booking data to render the QR Code
                if (data.booking) {
                    setBookingData(data.booking);
                }

                if (data.clientSecret) {
                    setBookingStatus({ type: 'success', message: 'Proceeding to payment gateway...' });
                    setTimeout(() => {
                        setBookingStatus({ type: 'success', message: 'Booking confirmed (simulated stripe flow)!' });
                    }, 2000);
                } else {
                    setBookingStatus({ type: 'success', message: 'Booking confirmed.' });
                }
            } else {
                const text = await res.text();
                setBookingStatus({ type: 'error', message: text });
            }
        } catch (error) {
            setBookingStatus({ type: 'error', message: 'Booking system offline.' });
        }
    };

    if (loading) return <div className="p-8"><div className="animate-pulse bg-gray-200 h-96 rounded-3xl w-full max-w-4xl mx-auto"></div></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans min-h-screen">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Book a Range
                </h1>
                <p className="text-lg text-gray-500">Select a facility, date, and time to secure your slot instantly.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-emerald-900/5 rounded-[2rem] p-10 border border-white/40">
                <form onSubmit={handleBook} className="space-y-8">
                    {/* Personal Details & Directory Interrogation */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Your Details</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                            
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md font-medium shadow-inner focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mobile Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md font-medium shadow-inner focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="e.g. +44 7700 900000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md font-medium shadow-inner focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="e.g. john@example.com"
                                    />
                                </div>
                            </div>
                            
                            {/* Right Column: Dynamic Membership Hook */}
                            <div className="flex flex-col h-full bg-white p-6 border-2 border-emerald-500/10 rounded-xl shadow-sm relative overflow-hidden">
                                {/* Subtle Background Graphic */}
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>

                                <h3 className="text-emerald-800 font-bold mb-1 items-center flex">
                                    Membership Status
                                    {isLookingUp && <span className="ml-2 text-xs font-medium text-emerald-500 animate-pulse">(Searching Directory...)</span>}
                                </h3>
                                <p className="text-gray-500 text-xs mb-4">
                                    We inherently cross-reference the directory for your details. If you have an active Membership Number, it will auto-populate below.
                                </p>

                                <div className="mt-auto">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Membership Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={membershipNumber}
                                        onChange={(e) => setMembershipNumber(e.target.value)}
                                        onBlur={(e) => verifyManualMembership(e.target.value)}
                                        className={`w-full px-4 py-3 bg-gray-50 border ${renewalWarning ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500' : 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500'} rounded-xl text-md font-bold text-gray-700 shadow-inner outline-none transition-all`}
                                        placeholder="Leave blank if not applicable"
                                    />
                                </div>
                                
                                {/* Renewal Notification Trigger */}
                                {renewalWarning && (
                                    <div className="mt-4 bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-lg text-sm font-semibold flex items-start animate-in fade-in zoom-in duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                        {renewalWarning}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Facility Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Facility</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {facilities.map(fac => (
                                <button
                                    type="button"
                                    key={fac.id}
                                    onClick={() => setSelectedFacility(fac.id)}
                                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${selectedFacility === fac.id
                                        ? 'border-emerald-500 bg-emerald-50 shadow-emerald-500/20 shadow-lg scale-[1.02]'
                                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <h3 className={`font-bold text-lg ${selectedFacility === fac.id ? 'text-emerald-900' : 'text-gray-900'}`}>{fac.name}</h3>
                                    <p className={`text-sm mt-1 ${selectedFacility === fac.id ? 'text-emerald-700' : 'text-gray-500'}`}>Capacity: {fac.capacity}</p>
                                    <p className="mt-3 inline-block px-3 py-1 bg-white rounded-md text-xs font-bold text-gray-800 shadow-sm border border-gray-100">From £{(fac.memberRate / 100).toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-lg font-medium shadow-inner focus:ring-4 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                            />
                        </div>

                        {/* Time Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Time (1h slot)</label>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-lg font-medium shadow-inner focus:ring-4 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                            />
                        </div>
                    </div>

                    {bookingStatus && (
                        <div className={`p-8 rounded-2xl animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center space-y-4 ${bookingStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-white border border-emerald-200 shadow-xl'
                            }`}>
                            <div className="text-center font-bold text-lg">
                                {bookingStatus.message}
                            </div>

                            {bookingStatus.type === 'success' && bookingData && (
                                <div className="mt-6 flex flex-col items-center p-6 bg-gray-50 rounded-xl border border-gray-100 w-full">
                                    <h4 className="text-emerald-700 font-bold mb-4 uppercase tracking-widest text-sm">Your Entrance Pass</h4>
                                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                                        <QRCode
                                            value={JSON.stringify({
                                                bookingId: bookingData.id,
                                                qrHash: bookingData.qrHash,
                                                type: 'BOOKING_VERIFICATION'
                                            })}
                                            size={200}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-gray-500 text-sm mt-4 text-center max-w-sm">
                                        Screenshot this code. You will need to present it to the Range Officer upon arrival.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg py-5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-1 active:translate-y-0 active:shadow-emerald-600/20"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
