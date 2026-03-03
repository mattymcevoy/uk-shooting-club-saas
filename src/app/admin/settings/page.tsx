'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, UploadCloud, Palette, Link as LinkIcon } from 'lucide-react';

type OrganizationSettings = {
    id: string;
    name: string;
    logoUrl: string | null;
    themeColor: string;
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<OrganizationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // For Vercel Blob mock upload UI
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setSettings({
                id: data.id,
                name: data.name,
                logoUrl: data.logoUrl,
                themeColor: data.themeColor || '#10b981'
            });
            if (data.logoUrl) setLogoPreview(data.logoUrl);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setSaving(true);

        try {
            // Mock Vercel Blob Upload
            const finalLogoUrl = logoFile
                ? `https://mock.blob.vercel-storage.com/logos/${logoFile.name}`
                : settings.logoUrl;

            const updateData = {
                ...settings,
                logoUrl: finalLogoUrl
            };

            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (res.ok) {
                // Settings saved
                alert('White Label settings applied successfully. Refresh to see branding changes.');
            }
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-emerald-400">Loading Configuration...</div>;
    if (!settings) return <div className="p-8 text-red-500">Failed to load organization settings.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    White Label Settings
                </h1>
                <p className="text-gray-400 mt-2">Customize the platform to match your shooting club's brand identity.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Brand Identity / Name & Subdomain */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Building2 className="mr-3 text-emerald-400" /> Brand Identity
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Club Name</label>
                            <input
                                required
                                type="text"
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Platform Subdomain</label>
                            <div className="relative">
                                <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    disabled
                                    type="text"
                                    value={`${settings.name.toLowerCase().replace(/\s+/g, '-')}.shootingapp.com`}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Included with your B2B SaaS license.</p>
                        </div>
                    </div>
                </div>

                {/* Theming & Logo */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Palette className="mr-3 text-emerald-400" /> Visual Theming
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Logo Upload */}
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-sm font-medium text-gray-400">Club Logo</label>
                            <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-colors bg-black/20">
                                {logoPreview ? (
                                    <div className="space-y-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={logoPreview} alt="Logo" className="w-32 h-auto mx-auto border border-white/10 rounded-lg bg-white/5 p-2" />
                                        <label className="cursor-pointer text-emerald-400 font-bold text-sm hover:underline">
                                            Change Logo
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                                        <div className="p-3 bg-white/5 rounded-full text-emerald-400">
                                            <UploadCloud size={28} />
                                        </div>
                                        <div>
                                            <span className="text-white font-medium block">Click to upload brand logo</span>
                                            <span className="text-gray-500 text-xs mt-1 block">SVG, PNG, JPG (max 2MB)</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Theme Color Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-4">Primary Theme Color</label>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: 'Emerald', hex: '#10b981' }, // Default
                                    { name: 'Royal Blue', hex: '#2563eb' },
                                    { name: 'Crimson', hex: '#dc2626' },
                                    { name: 'Amber', hex: '#d97706' },
                                    { name: 'Slate', hex: '#475569' },
                                    { name: 'Purple', hex: '#9333ea' },
                                ].map((color) => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, themeColor: color.hex })}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${settings.themeColor === color.hex ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                    >
                                        <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: color.hex }}></div>
                                        <span className="text-xs text-gray-300 font-medium">{color.name}</span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                                This color will be applied to buttons, accents, and QR codes across your public-facing member portal.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        disabled={saving}
                        type="submit"
                        className="flex items-center space-x-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save & Publish Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
