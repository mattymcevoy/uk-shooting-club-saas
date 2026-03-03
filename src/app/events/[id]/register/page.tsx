'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Mail, Phone, ArrowLeft, Target } from 'lucide-react';

export default function EventRegistrationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const eventId = params.id;

    const [themeColor, setThemeColor] = useState('#10b981');
    const [clubName, setClubName] = useState('Shooting Club');

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // In a real app we'd fetch the specific Event details and the Org theme here first.
    // For this demonstration, we'll just extract the org theme from the global settings endpoint.
    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.themeColor) setThemeColor(data.themeColor);
                if (data.name) setClubName(data.name);
            } catch (e) { }
        };
        fetchBrand();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, eventId }),
            });

            if (!res.ok) throw new Error('Registration failed');

            router.push(`/dashboard?event_success=true`);
        } catch (error) {
            console.error(error);
            alert('Failed to register. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-4">

            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back to Events</span>
            </button>

            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">

                {/* Branding Accent */}
                <div
                    className="absolute top-0 left-0 w-full h-2"
                    style={{ backgroundColor: themeColor }}
                ></div>

                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white/10"
                        style={{ color: themeColor }}
                    >
                        <Target size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Register for Event</h1>
                    <p className="text-sm text-gray-400 mt-2">Join {clubName} for an upcoming shoot.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:ring-2 transition-all placeholder:text-gray-600"
                                style={{ '--tw-ring-color': themeColor } as any}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:ring-2 transition-all placeholder:text-gray-600"
                                style={{ '--tw-ring-color': themeColor } as any}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:ring-2 transition-all placeholder:text-gray-600"
                                style={{ '--tw-ring-color': themeColor } as any}
                                placeholder="+44 7700 900000"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full py-4 mt-6 rounded-xl font-bold text-center transition-all disabled:opacity-50 hover:brightness-110 shadow-lg"
                        style={{ backgroundColor: themeColor, color: '#0B0F19' }}
                    >
                        {loading ? 'Processing...' : 'Confirm Registration'}
                    </button>

                    <p className="text-xs text-center text-gray-500 mt-4">
                        By registering, you will be added to the {clubName} guest register.
                    </p>
                </form>
            </div>
        </div>
    );
}
