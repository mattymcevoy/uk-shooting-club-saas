'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus } from 'lucide-react';

export default function SuperAdminPricingPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        monthlyPrice: '',
        annualPrice: ''
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/super/pricing');
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error('Failed to load platform plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/super/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    monthlyPrice: formData.monthlyPrice,
                    annualPrice: formData.annualPrice
                })
            });
            if (res.ok) {
                setFormData({ name: '', description: '', monthlyPrice: '', annualPrice: '' });
                setShowCreate(false);
                fetchPlans();
            }
        } catch (error) {
            console.error('Failed to create platform plan', error);
        }
    };

    if (loading) return <div className="p-8 text-indigo-400">Loading Global SaaS Pricing...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-indigo-950/30 p-6 rounded-3xl border border-indigo-500/20">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">SuperAdmin SaaS Pricing</h1>
                        <p className="text-indigo-200 mt-1">Manage global B2B subscription licenses across all Tenant Clubs.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                >
                    <Plus size={20} />
                    <span>New SaaS Tier</span>
                </button>
            </div>

            {showCreate && (
                <div className="bg-white/5 border border-indigo-500/30 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-white">Create Global SaaS License</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">License Name (e.g. Club Standard, Enterprise)</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Monthly Price (£)</label>
                            <input required type="number" step="0.01" value={formData.monthlyPrice} onChange={e => setFormData({ ...formData, monthlyPrice: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Annual Price (£)</label>
                            <input required type="number" step="0.01" value={formData.annualPrice} onChange={e => setFormData({ ...formData, annualPrice: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-indigo-500" />
                        </div>
                        <div className="flex justify-end md:col-span-2">
                            <button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-2.5 rounded-xl transition-all">
                                Deploy SaaS Tier
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-indigo-500/20 rounded-3xl text-gray-500">
                        No active SaaS tiers. New clubs will default to the standard hardcoded Stripe checkouts.
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="bg-gradient-to-b from-gray-900 to-black border border-indigo-500/30 p-6 rounded-3xl hover:border-indigo-400 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-400/20 transition-colors"></div>

                            <Shield className="text-indigo-400 mb-4" size={24} />

                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-sm text-gray-400 mt-1 min-h-[40px]">{plan.description}</p>

                            <div className="mt-6 pt-6 border-t border-white/5 space-y-2 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Monthly License</span>
                                    <span className="font-bold text-white">£{(plan.monthlyPrice / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-indigo-500/10 -mx-4 px-4 py-2 rounded-lg mt-2">
                                    <span className="text-indigo-200 text-sm font-bold">Annual License</span>
                                    <span className="font-bold text-indigo-400">£{(plan.annualPrice / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
