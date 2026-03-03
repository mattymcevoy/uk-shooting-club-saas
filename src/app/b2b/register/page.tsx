'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle, ArrowRight, Building2, User } from 'lucide-react';

export default function B2BRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clubName: '',
        ownerName: '',
        ownerEmail: '',
        platformPlanId: '', // Dynamic SaaS Plan
        billingCycle: 'monthly' as 'monthly' | 'annual',
    });

    const [plans, setPlans] = useState<any[]>([]);

    // Fetch Global SaaS Plans from DB
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/admin/super/pricing');
                const data = await res.json();
                setPlans(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, platformPlanId: data[0].id }));
                }
            } catch (err) {
                console.error("Failed to load SaaS plans", err);
            }
        };
        fetchPlans();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/b2b/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe B2B Checkout
            } else {
                router.push('/dashboard?b2b_success=true');
            }
        } catch (err: any) {
            setErrorMsg(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center py-16 px-4 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-900/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

            <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Sales Pitch Left Side */}
                <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                    <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 font-semibold text-sm">
                        <Target size={16} />
                        <span>For Shooting Grounds & Clubs</span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                        Modernize your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            Shooting Estate.
                        </span>
                    </h1>

                    <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                        Launch your own custom-branded membership portal. Manage automated range bookings, capture digital gun certificates, and issue secure QR IDs to your members.
                    </p>

                    <div className="space-y-4 pt-4">
                        {['White-label custom branding', 'Digital membership cards with secure QR', 'Automated facility booking engine', 'Paperless certificate storage compliance'].map((feature, i) => (
                            <div key={i} className="flex items-center space-x-3 text-gray-300">
                                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Right Side */}
                <div className="bg-white/5 border border-white/10 p-8 lg:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
                    <h2 className="text-2xl font-bold mb-6">Create your Platform Tenant</h2>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-medium mb-6">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Club / Organization Name</label>
                            <div className="relative">
                                <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    required
                                    type="text"
                                    value={formData.clubName}
                                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                                    placeholder="e.g. Royal Berkshire Shooting"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Owner Name</label>
                                <div className="relative">
                                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.ownerEmail}
                                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                                    placeholder="jane@club.com"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-300 mb-3">SaaS Licensing Tier</label>

                            {plans.length === 0 ? (
                                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm">
                                    No SaaS plans configured.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {plans.map(plan => (
                                        <div key={plan.id} className={`border rounded-xl p-4 transition-all cursor-pointer ${formData.platformPlanId === plan.id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-black/20 border-white/10 hover:border-white/30'}`} onClick={() => setFormData({ ...formData, platformPlanId: plan.id })}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className={`font-bold ${formData.platformPlanId === plan.id ? 'text-emerald-400' : 'text-white'}`}>{plan.name}</h3>
                                                    <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, platformPlanId: plan.id, billingCycle: 'monthly' }); }}
                                                    className={`py-3 rounded-lg border flex flex-col items-center justify-center transition-all ${formData.platformPlanId === plan.id && formData.billingCycle === 'monthly' ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-bold' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                                                >
                                                    <span className="text-sm">Monthly</span>
                                                    <span>£{(plan.monthlyPrice / 100).toFixed(2)}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, platformPlanId: plan.id, billingCycle: 'annual' }); }}
                                                    className={`py-3 rounded-lg border flex flex-col items-center justify-center transition-all ${formData.platformPlanId === plan.id && formData.billingCycle === 'annual' ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-bold' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                                                >
                                                    <span className="text-sm">Annual <span className="text-[10px] ml-1 opacity-70">(-20%)</span></span>
                                                    <span>£{(plan.annualPrice / 100).toFixed(2)}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-lg rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] flex justify-center items-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Launch Your Platform</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            By clicking launch, you will be directed to our secure Stripe checkout to complete your SaaS platform subscription.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
