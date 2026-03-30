'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Settings, Shield, Edit2, Loader2, ArrowRight } from 'lucide-react';

type MembershipPlan = {
    id: string;
    name: string;
    description: string | null;
    monthlyPrice: number;
    annualPrice: number;
    stripeMonthlyPriceId: string | null;
    stripeAnnualPriceId: string | null;
    isActive: boolean;
};

export default function PlansPage() {
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState<MembershipPlan | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        monthlyPrice: '',
        annualPrice: '',
        isActive: true,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/financials/plans');
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans', error);
        }
        setLoading(false);
    };

    const handleOpenEdit = (plan: MembershipPlan) => {
        setIsEditing(plan);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            monthlyPrice: (plan.monthlyPrice / 100).toFixed(2),
            annualPrice: (plan.annualPrice / 100).toFixed(2),
            isActive: plan.isActive,
        });
        setIsCreating(true);
    };

    const handleOpenCreate = () => {
        setIsEditing(null);
        setFormData({
            name: '',
            description: '',
            monthlyPrice: '',
            annualPrice: '',
            isActive: true,
        });
        setIsCreating(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const endpoint = isEditing ? `/api/admin/financials/plans/${isEditing.id}` : '/api/admin/financials/plans';
            const method = isEditing ? 'PUT' : 'POST';

            // Convert back to pennies
            const body = {
                ...formData,
                monthlyPrice: Math.round(parseFloat(formData.monthlyPrice) * 100),
                annualPrice: Math.round(parseFloat(formData.annualPrice) * 100),
            };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsCreating(false);
                setIsEditing(null);
                await fetchPlans();
            } else {
                alert('Plan could not be saved.');
            }
        } catch (error) {
            console.error(error);
        }

        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this specific plan tier entirely?')) return;
        
        try {
            const res = await fetch(`/api/admin/financials/plans/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchPlans();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="p-8 text-center text-emerald-400 flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                            Membership Plans
                        </h1>
                        <p className="text-gray-400 mt-1">Configure user signup plans, tier pricing, and Stripe integration logic.</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Tier</span>
                </button>
            </div>

            {/* Grid of existing plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div 
                        key={plan.id} 
                        onClick={() => handleOpenEdit(plan)}
                        className={`relative rounded-3xl p-6 border backdrop-blur-md cursor-pointer transition-all group ${
                            plan.isActive ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10' : 'bg-black/40 border-gray-800 opacity-60 hover:opacity-80 hover:border-gray-500'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {plan.name || 'Unnamed Plan'}
                                </h2>
                            </div>
                            {plan.isActive ? (
                                <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/10">Active</div>
                            ) : (
                                <div className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Inactive</div>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mb-6 h-10 line-clamp-2">{plan.description || "No description provided."}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 pt-4 border-t border-white/5">
                            <div className="p-3 rounded-xl border border-white/10 bg-black/20 group-hover:border-emerald-500/30 transition-colors">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Monthly</div>
                                <div className="font-extrabold text-2xl text-white">
                                    £{(plan.monthlyPrice / 100).toFixed(2)}<span className="text-sm font-normal text-gray-500">/mo</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-white/10 bg-black/20 group-hover:border-emerald-500/30 transition-colors">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Annually</div>
                                <div className="font-extrabold text-2xl text-white">
                                    £{(plan.annualPrice / 100).toFixed(2)}<span className="text-sm font-normal text-gray-500">/yr</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 border-t border-white/5 pt-4">
                            <div className="flex-1 bg-white/5 group-hover:bg-emerald-500/20 text-white group-hover:text-emerald-400 font-medium py-2 rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors">
                                <Edit2 className="w-4 h-4" />
                                <span>Click anywhere to Edit Plan</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(plan.id);
                                }}
                                className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center rounded-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {plans.length === 0 && (
                    <div className="col-span-full border border-dashed border-white/20 rounded-3xl p-12 text-center text-gray-500 flex flex-col items-center">
                        <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Membership Plans</h3>
                        <p>You haven't set up any membership plans yet. Configure them to allow users to subscribe.</p>
                        <button
                            onClick={handleOpenCreate}
                            className="mt-6 flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            <span>Create Your First Plan</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal for Editor */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {isEditing ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Plan Name (e.g., VIP, Full Member)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none h-24"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Monthly Price (£)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.monthlyPrice}
                                        onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Annual Price (£)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        value={formData.annualPrice}
                                        onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-black/20"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-300">Plan is publicly active</span>
                                </label>
                                <p className="text-xs text-gray-500 ml-8 mt-1">
                                    If unchecked, this plan will be hidden from the join page but existing subscribers won't be affected.
                                </p>
                            </div>

                            <div className="pt-6 flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 px-4 rounded-xl font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Plan & Sync Stripe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
