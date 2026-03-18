'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { User, Shield, KeyRound, Clock, MapPin, UploadCloud, CheckCircle, CreditCard } from 'lucide-react';
import type { User as PrismaUser } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MemberDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [user, setUser] = useState<PrismaUser | any>(null);
    const [loading, setLoading] = useState(true);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isToppingUp, setIsToppingUp] = useState(false);

    // New state for uploads
    const [isUploading, setIsUploading] = useState<'certificate' | 'photo' | null>(null);
    const [isDeleting, setIsDeleting] = useState<'certificate' | 'photo' | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated') {
            const fetchProfile = async () => {
                try {
                    const res = await fetch('/api/user/me');
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data);
                    } else {
                        console.error('Failed to fetch user profile');
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchProfile();
        }

        // Grab temp password if it exists from signup redirection
        const tempPwd = sessionStorage.getItem('tempPassword');
        if (tempPwd) {
            setTempPassword(tempPwd);
            sessionStorage.removeItem('tempPassword');
        }
    }, [status, router]);

    const handleTopUp = async () => {
        setIsToppingUp(true);
        try {
            const res = await fetch('/api/wallet/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 3500, description: "100 Clays Topup" }) // Hardcoded approx 100 clays for £35 as requested
            });
            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(`Top-up unavailable: ${data.error || 'Check Stripe API configuration'}`);
            }
        } catch (err) {
            console.error("Failed to initiate top-up", err);
        } finally {
            setIsToppingUp(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'certificate' | 'photo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(fileType);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fileType);
        formData.append('action', 'upload');

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                const error = await res.json();
                alert(`Upload failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('An error occurred during upload.');
        } finally {
            setIsUploading(null);
            // reset file input
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (fileType: 'certificate' | 'photo') => {
        if (!confirm(`Are you sure you want to delete your ${fileType}?`)) return;

        setIsDeleting(fileType);
        const formData = new FormData();
        formData.append('type', fileType);
        formData.append('action', 'delete');

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleAccessToggle = async (grantAccess: boolean) => {
        try {
            const res = await fetch('/api/user/access', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grantAccess }),
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Error updating access:', error);
        }
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

            {/* Access Request Banner Alert */}
            {user.licenseAccessRequested && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-amber-900/10 mb-8">
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Action Required: Compliance Check</h3>
                            <p className="text-sm text-gray-300 mt-1 max-w-xl">
                                An authorised admin has requested access to view your gun licence. Please click allow to permit access for compliance purposes.
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleAccessToggle(false)}
                            className="px-6 py-2 rounded-xl font-medium text-gray-400 bg-black/50 border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            Deny
                        </button>
                        <button
                            onClick={() => handleAccessToggle(true)}
                            className="px-6 py-2 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            Allow Access
                        </button>
                    </div>
                </div>
            )}

            {tempPassword && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-emerald-900/10 mb-8">
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Your Temporary Password</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-xl">
                                We've generated a secure temporary password for your new account. Please save it securely. You can use it to log in on your next visit.
                            </p>
                        </div>
                    </div>
                    <div className="bg-black/50 border border-white/10 px-6 py-4 rounded-xl flex items-center space-x-6">
                        <span className="text-2xl font-mono text-emerald-400 tracking-widest">{tempPassword}</span>
                    </div>
                </div>
            )}

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

                    {/* E-Wallet Section */}
                    <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 text-emerald-500/10 hidden md:block">
                            <CreditCard size={180} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                                    <CreditCard className="mr-3 text-emerald-400" /> E-Wallet Balance
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Pre-load digital clays onto your account to spend seamlessly at the stands.
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                                <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                                    £{((user.creditBalance || 0) / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest mt-1">
                                    ~ {Math.floor((user.creditBalance || 0) / 35)} Clays Available
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 mt-6 pt-6 border-t border-emerald-500/20 flex flex-wrap gap-4 items-center">
                            <button
                                onClick={handleTopUp}
                                disabled={isToppingUp}
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center"
                            >
                                {isToppingUp ? 'Processing...' : 'Load 100 Clays (£35)'}
                            </button>
                            <button className="px-6 py-2.5 bg-black/50 border border-white/10 hover:border-white/30 text-white font-medium rounded-xl transition-all flex items-center">
                                <Clock size={16} className="mr-2 text-gray-400" /> View History
                            </button>
                        </div>
                    </div>

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
                                <div className="mt-4 md:mt-0 flex space-x-3">
                                    {user.certificateUrl && (
                                        <button
                                            onClick={() => handleDeleteFile('certificate')}
                                            disabled={isDeleting === 'certificate'}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-red-500/30"
                                        >
                                            {isDeleting === 'certificate' ? '...' : 'Remove'}
                                        </button>
                                    )}
                                    <label className={`bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-gray-600 ${isUploading === 'certificate' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {isUploading === 'certificate' ? 'Uploading...' : (user.certificateUrl ? 'Update File' : 'Upload File')}
                                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'certificate')} disabled={isUploading === 'certificate'} />
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
                                <div className="mt-4 md:mt-0 flex space-x-3">
                                    {user.profilePhotoUrl && (
                                        <button
                                            onClick={() => handleDeleteFile('photo')}
                                            disabled={isDeleting === 'photo'}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-red-500/30"
                                        >
                                            {isDeleting === 'photo' ? '...' : 'Remove'}
                                        </button>
                                    )}
                                    <label className={`bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors border border-gray-600 ${isUploading === 'photo' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {isUploading === 'photo' ? 'Uploading...' : (user.profilePhotoUrl ? 'Update Photo' : 'Upload Photo')}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} disabled={isUploading === 'photo'} />
                                    </label>
                                </div>
                            </div>

                            {/* Privacy Toggle for Admins */}
                            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-white">Document Privacy</h4>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">Allow administrators and staff to view your uploaded firearms license documents for compliance verification.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={user.licenseAccessGranted || false}
                                        onChange={(e) => handleAccessToggle(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
