'use client';

import { useState, useEffect } from 'react';
import { Target, Plus } from 'lucide-react';

export default function TenantPricingAdminPage() {
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
            const res = await fetch('/api/admin/settings/pricing');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPlans(data);
            } else {
                console.error("API did not return an array:", data);
                setPlans([]);
            }
        } catch (error) {
            console.error('Failed to load pricing plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/settings/pricing', {
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
            console.error('Failed to create plan', error);
        }
    };

    if (loading) return <div className="p-8 text-emerald-400">Loading Pricing...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Membership Tiers</h1>
                    <p className="text-gray-400 mt-2">Manage the pricing options shown to customers during registration.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    <Plus size={20} />
                    <span>New Tier</span>
                </button>
            </div>

            {showCreate && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-white">Create Membership Tier</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Tier Name (e.g. Full Member, VIP)</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Description (Benefits)</label>
                            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Monthly Price (£)</label>
                            <input required type="number" step="0.01" value={formData.monthlyPrice} onChange={e => setFormData({ ...formData, monthlyPrice: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Annual Price (£)</label>
                            <input required type="number" step="0.01" value={formData.annualPrice} onChange={e => setFormData({ ...formData, annualPrice: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" />
                        </div>
                        <div className="flex justify-end md:col-span-2">
                            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 py-2.5 rounded-xl transition-all">
                                Save Tier
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-3xl text-gray-500">
                        No membership tiers defined. Customers will see your default hardcoded plans.
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="bg-gradient-to-b from-gray-900 to-black border border-white/10 p-6 rounded-3xl hover:border-emerald-500/50 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>

                            <Target className="text-emerald-500 mb-4" size={24} />

                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-sm text-gray-400 mt-1 min-h-[40px]">{plan.description}</p>

                            <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Monthly</span>
                                    <span className="font-bold text-emerald-400">£{(plan.monthlyPrice / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Annually</span>
                                    <span className="font-bold text-teal-400">£{(plan.annualPrice / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
