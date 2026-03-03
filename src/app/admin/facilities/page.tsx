'use client';

import { useState, useEffect } from 'react';

type Facility = {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    baseRate: number;
    memberRate: number;
    isActive: boolean;
};

export default function FacilitiesAdmin() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [capacity, setCapacity] = useState(1);
    const [baseRate, setBaseRate] = useState(0); // in pence
    const [memberRate, setMemberRate] = useState(0); // in pence
    const [isActive, setIsActive] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/facilities');
            if (res.ok) {
                const data = await res.json();
                setFacilities(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (fac: Facility) => {
        setEditingId(fac.id);
        setName(fac.name);
        setDescription(fac.description || '');
        setCapacity(fac.capacity);
        setBaseRate(fac.baseRate / 100);
        setMemberRate(fac.memberRate / 100);
        setIsActive(fac.isActive);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = '/api/facilities';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    name,
                    description,
                    capacity: Number(capacity),
                    baseRate: Number(baseRate) * 100, // convert pounds to pence
                    memberRate: Number(memberRate) * 100, // convert pounds to pence
                    isActive,
                }),
            });

            if (res.ok) {
                setEditingId(null);
                setName('');
                setDescription('');
                setCapacity(1);
                setBaseRate(0);
                setMemberRate(0);
                setIsActive(true);
                fetchFacilities();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Facility Rate & Schedule Configuration</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Create Form */}
                <div className="lg:col-span-1 bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-sm border border-gray-100 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {editingId ? 'Edit Facility' : 'Create Facility'}
                        </h2>
                        {editingId && (
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setName('');
                                    setDescription('');
                                    setCapacity(1);
                                    setBaseRate(0);
                                    setMemberRate(0);
                                    setIsActive(true);
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. 50M Gallery Range"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Lanes/Pegs)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (£)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={baseRate}
                                    onChange={(e) => setBaseRate(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Member Rate (£)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={memberRate}
                                    onChange={(e) => setMemberRate(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        {editingId && (
                            <div>
                                <label className="flex items-center space-x-2 mt-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Facility is Active</span>
                                </label>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {editingId ? 'Update Facility' : 'Add Facility'}
                        </button>
                    </form>
                </div>

                {/* Right Col: Facility List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-gray-200 rounded-2xl w-full"></div>
                            ))}
                        </div>
                    ) : facilities.length === 0 ? (
                        <div className="bg-white/50 border border-dashed border-gray-300 rounded-3xl p-12 text-center">
                            <p className="text-gray-500 text-lg">No facilities configured yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {facilities.map((fac) => (
                                <div key={fac.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{fac.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{fac.description || 'No description'}</p>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${fac.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {fac.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={() => handleEditClick(fac)}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Capacity</span>
                                            <span className="font-bold text-gray-900">{fac.capacity} Lanes/Pegs</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Guest Rate</span>
                                            <span className="font-bold text-gray-900">£{(fac.baseRate / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Member Rate</span>
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">£{(fac.memberRate / 100).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
