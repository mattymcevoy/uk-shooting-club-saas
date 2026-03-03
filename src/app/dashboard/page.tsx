'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { User, Shield, CreditCard, Clock, MapPin, UploadCloud, CheckCircle } from 'lucide-react';
import type { User as PrismaUser } from '@prisma/client';

export default function MemberDashboard() {
    const [user, setUser] = useState<PrismaUser | null>(null);
    const [loading, setLoading] = useState(true);

    // In a real app, this would use NextAuth or similar to get the logged-in ID
    // We use a mock ID assigned in the Prisma schema for demonstration
    const [mockUserId, setMockUserId] = useState<string | null>(null);

    useEffect(() => {
        // 1. Fetch the first user to act as our logged in user for this demo
        const fetchProfile = async () => {
            try {
                const memRes = await fetch('/api/admin/members');
                const allMembers = await memRes.json();

                if (allMembers && allMembers.length > 0) {
                    const activeUser = allMembers[0];
                    setUser(activeUser);
                    setMockUserId(activeUser.id);
                }
            } catch (e) {
                console.error('Failed to load profile', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'certificate' | 'photo') => {
        // NOTE: This will be implemented in the next step when hooking up Vercel Blob
        alert(`File selected for ${fileType}. Upload integration pending.`);
    };

    if (loading) {
        return <div className="p-8 text-center text-emerald-400">Loading Profile...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500">No user profile found.</div>;
    }

    // Generate the highly secure JSON payload that will be embedded in the QR Code
    // In a real app, you would cryptographic sign this payload, but for this demo 
    // we embed the IDs that the scanner will verify against the DB.
    const qrPayload = JSON.stringify({
        userId: user.id,
        qrHash: user.qrHash, // This acts as the secure secret validation key
        type: 'MEMBERSHIP_VERIFICATION'
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    Member Dashboard
                </h1>
                <p className="text-gray-400 mt-2">Manage your club profile, physical documents, and active subscriptions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Digital ID Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-emerald-900/20">
                        {/* Background embellishment */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                            <Shield size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-emerald-900/40 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-4">
                                {user.profilePhotoUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="text-emerald-400 w-12 h-12" />
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-white text-center">{user.name}</h2>
                            <div className="flex items-center space-x-2 mt-2">
                                <Shield size={16} className="text-emerald-400" />
                                <span className="text-emerald-400 font-semibold tracking-wider text-sm">
                                    {user.membershipTier.replace('_', ' ')}
                                </span>
                            </div>

                            {/* The Core Requirement: Dynamic Profile QR Code */}
                            <div className="mt-8 bg-white p-4 rounded-xl shadow-inner inline-block">
                                <QRCode
                                    value={qrPayload}
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                />
                            </div>
                            <p className="text-gray-500 text-xs mt-4 text-center">
                                Scan at reception to verify membership and range eligibility.
                            </p>
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-4 flex justify-between tracking-wide text-xs">
                            <div className="text-gray-400">STATUS: <span className="text-emerald-400 ml-1">{user.status}</span></div>
                            <div className="text-gray-400 text-right">Joined: <span className="text-white ml-1">{new Date(user.createdAt).getFullYear()}</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Profile & Documents */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <User className="mr-3 text-emerald-400" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Email Address</p>
                                <p className="font-medium text-white">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Mobile Number</p>
                                <p className="font-medium text-white">{user.phone || 'Not provided'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500 mb-1">Full Postal Address</p>
                                <p className="font-medium text-white whitespace-pre-line">{user.address || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Certificate Number</p>
                                <p className="font-medium text-white">{user.certificateNumber || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">License Holder</p>
                                <p className="font-medium text-white flex items-center">
                                    {user.isLicenseHolder ? <><CheckCircle size={16} className="text-emerald-400 mr-2" /> Verified</> : 'Pending Verification'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <UploadCloud className="mr-3 text-emerald-400" /> Compliance Documents
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Securely upload your valid firearms certificates and photo ID. These are required before you can book a range slot.
                        </p>

                        <div className="space-y-4">
                            <div className="border border-dashed border-gray-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between hover:border-emerald-500/50 transition-colors bg-black/20">
                                <div>
                                    <h4 className="font-medium text-white flex items-center">
                                        Firearms Certificate
                                        {user.certificateUrl && <CheckCircle size={14} className="text-emerald-400 ml-2" />}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">PDF or high-res image showing validity dates.</p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <label className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-gray-600">
                                        {user.certificateUrl ? 'Update File' : 'Upload File'}
                                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'certificate')} />
                                    </label>
                                </div>
                            </div>

                            <div className="border border-dashed border-gray-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between hover:border-emerald-500/50 transition-colors bg-black/20">
                                <div>
                                    <h4 className="font-medium text-white flex items-center">
                                        Profile Headshot
                                        {user.profilePhotoUrl && <CheckCircle size={14} className="text-emerald-400 ml-2" />}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">Clear photo for your digital and physical membership cards.</p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <label className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-gray-600">
                                        {user.profilePhotoUrl ? 'Update Photo' : 'Upload Photo'}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
