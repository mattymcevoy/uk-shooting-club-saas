'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Save, Trash, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [isDigital, setIsDigital] = useState(true);
    const [claysAmount, setClaysAmount] = useState('');
    const [stock, setStock] = useState('0');
    const [expiresAt, setExpiresAt] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setIsDigital(true);
        setClaysAmount('');
        setStock('0');
        setExpiresAt('');
        setEditingId(null);
        setIsAdding(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                description,
                price: parseFloat(price) * 100, // convert pounds to pennies
                isDigital,
                claysAmount,
                stock,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            };

            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetForm();
                fetchProducts();
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} product. Check parameters or NaN values.`);
            }
        } catch (error) {
            console.error('Save error', error);
        }
    };

    const handleEdit = (p: any) => {
        setEditingId(p.id);
        setName(p.name);
        setDescription(p.description || '');
        setPrice((p.price / 100).toString());
        setIsDigital(p.isDigital);
        setClaysAmount(p.claysAmount?.toString() || '');
        setStock(p.stock?.toString() || '0');
        
        // Format datetime-local string
        if (p.expiresAt) {
            const dateObj = new Date(p.expiresAt);
            // Convert to local YYYY-MM-DDTHH:mm format
            const tzOffset = dateObj.getTimezoneOffset() * 60000; // offset in milliseconds
            const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
            setExpiresAt(localISOTime);
        } else {
            setExpiresAt('');
        }
        
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this product? It will be removed from all member facing dashboards.')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchProducts();
            } else {
                alert('Failed to delete product.');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Shooting Products Editor</h1>
                    <p className="text-gray-500 mt-2">Manage all digital clay packages and physical items sold in the member dashboard.</p>
                </div>
                <button 
                    onClick={() => {
                        if (isAdding) resetForm();
                        else setIsAdding(true);
                    }}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-md"
                >
                    <Plus size={18} />
                    <span>{isAdding ? 'Cancel' : 'New Product'}</span>
                </button>
            </div>

            {isAdding && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 animate-in slide-in-from-top-4 fade-in">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">{editingId ? 'Edit Product Configuration' : 'Create New Product'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 p-3" placeholder="e.g. 500 Clays Bundle" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (£)</label>
                                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 p-3" placeholder="150.00" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 p-3" placeholder="Benefits or specifics regarding this package..."></textarea>
                            </div>
                        </div>

                        <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100/50">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date & Time (Optional)</label>
                            <p className="text-xs text-gray-500 mb-3">If set, members cannot purchase this package after this date.</p>
                            <input 
                                type="datetime-local" 
                                value={expiresAt} 
                                onChange={e => setExpiresAt(e.target.value)} 
                                className="w-full md:w-1/2 border-gray-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-3" 
                            />
                        </div>

                        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100/50">
                            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
                                <input type="checkbox" checked={isDigital} onChange={e => setIsDigital(e.target.checked)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 w-5 h-5" />
                                <span className="font-semibold text-gray-800">Is this a Digital Product? (e.g. Clays/Credits)</span>
                            </label>

                            {isDigital ? (
                                <div className="mt-4 animate-in fade-in">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Clays Granted</label>
                                    <input type="number" value={claysAmount} onChange={e => setClaysAmount(e.target.value)} required={isDigital} className="w-full md:w-1/2 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-3" placeholder="e.g. 500" />
                                </div>
                            ) : (
                                <div className="mt-4 animate-in fade-in">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Physical Stock (Inventory)</label>
                                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} required={!isDigital} className="w-full md:w-1/2 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-3" placeholder="e.g. 50" />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button type="submit" className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-shadow shadow-md hover:shadow-lg">
                                <Save size={18} />
                                <span>{editingId ? 'Update Product' : 'Save Product Item'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Loading Products Inventory...</div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-700">No products configured</h3>
                        <p className="mt-2 text-sm max-w-sm">You have not created any shooting merchandise or digital clay packages yet. Add one above to populate the member portal.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Product Name</th>
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Type</th>
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Contents/Stock</th>
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase">Expires</th>
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase text-right">Price (£)</th>
                                    <th className="py-4 px-6 font-bold text-gray-600 text-sm tracking-wider uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 border-b border-gray-50">
                                            <p className="font-bold text-gray-900">{p.name}</p>
                                            {p.description && <p className="text-sm text-gray-500 truncate max-w-xs">{p.description}</p>}
                                        </td>
                                        <td className="py-4 px-6 border-b border-gray-50">
                                            {p.isDigital ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                                    DIGITAL CREDIT
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                                    PHYSICAL GOODS
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-b border-gray-50 font-medium text-gray-700">
                                            {p.isDigital ? `${p.claysAmount} Clays` : `${p.stock} in Stock`}
                                        </td>
                                        <td className="py-4 px-6 border-b border-gray-50 text-sm text-gray-600">
                                            {p.expiresAt ? (
                                                <span className={new Date(p.expiresAt) < new Date() ? 'text-red-500 font-bold' : ''}>
                                                    {format(new Date(p.expiresAt), 'MMM d, yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Never</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-b border-gray-50 text-right font-black text-gray-900">
                                            £{(p.price / 100).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6 border-b border-gray-50 text-right">
                                            <button 
                                                onClick={() => handleEdit(p)}
                                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors mr-2"
                                                title="Edit Product"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p.id)}
                                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete Product"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
