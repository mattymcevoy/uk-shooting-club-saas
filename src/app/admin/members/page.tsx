'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Phone, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import type { User as PrismaUser, Subscription, MembershipTier, AccountStatus } from '@prisma/client';

type MemberWithSub = PrismaUser & {
    subscriptions: { status: string; currentPeriodEnd: Date }[];
};

export default function AdminMembersPage() {
    const [members, setMembers] = useState<MemberWithSub[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<MemberWithSub | null>(null);

    // Edit Form State
    const [editForm, setEditForm] = useState<Partial<PrismaUser>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isRequestingAccess, setIsRequestingAccess] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/members');
            const data = await res.json();
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
        setLoading(false);
    };

    const handleEditClick = (member: MemberWithSub) => {
        setSelectedMember(member);
        setEditForm({
            name: member.name,
            phone: member.phone || '',
            address: member.address || '',
            certificateNumber: member.certificateNumber || '',
            membershipTier: member.membershipTier,
            status: member.status,
            isLicenseHolder: member.isLicenseHolder,
            isRegisteredShooter: member.isRegisteredShooter,
        });
    };

    const handleSave = async () => {
        if (!selectedMember) return;
        setIsSaving(true);

        try {
            const res = await fetch('/api/admin/members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedMember.id, ...editForm }),
            });

            if (res.ok) {
                setSelectedMember(null);
                await fetchMembers();
            } else {
                alert('Failed to update member');
            }
        } catch (error) {
            console.error('Update error', error);
        }

        setIsSaving(false);
    };

    const handleRequestAccess = async () => {
        if (!selectedMember) return;
        setIsRequestingAccess(true);

        try {
            const res = await fetch('/api/user/access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedMember.id }),
            });

            if (res.ok) {
                await fetchMembers();
                setSelectedMember({ ...selectedMember, licenseAccessRequested: true });
                alert('Access request sent to member.');
            } else {
                alert('Failed to request access.');
            }
        } catch (error) {
            console.error('Request error', error);
        }

        setIsRequestingAccess(false);
    };

    if (loading) return <div className="p-8 text-center text-emerald-400">Loading Members...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Member Directory
                    </h1>
                    <p className="text-gray-400 mt-2">Manage all registered shooters, licenses, and tiers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Members List */}
                <div className="lg:col-span-2 space-y-4">
                    {members.map((member) => (
                        <div key={member.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex justify-between items-center hover:border-emerald-500/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                                    <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center"><Mail size={14} className="mr-1" /> {member.email}</span>
                                        <span className="flex items-center"><Shield size={14} className="mr-1" /> {member.membershipTier}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex space-x-2">
                                    {member.isLicenseHolder && <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">License</span>}
                                    {member.isRegisteredShooter && <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Shooter</span>}
                                    <span className={`px-2 py-1 rounded text-xs ${member.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {member.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleEditClick(member)}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit Panel Sidebar */}
                <div>
                    {selectedMember ? (
                        <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-6 sticky top-24 shadow-2xl shadow-emerald-900/20">
                            <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-4">Edit Member</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        value={editForm.phone || ''}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Postal Address</label>
                                    <textarea
                                        rows={2}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                                        value={editForm.address || ''}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Gun Certificate #</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        value={editForm.certificateNumber || ''}
                                        onChange={(e) => setEditForm({ ...editForm, certificateNumber: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Tier</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                            value={editForm.membershipTier || ''}
                                            onChange={(e) => setEditForm({ ...editForm, membershipTier: e.target.value as MembershipTier })}
                                        >
                                            <option value="GUEST">GUEST</option>
                                            <option value="PROBATIONARY">PROBATIONARY</option>
                                            <option value="FULL_MEMBER">FULL_MEMBER</option>
                                            <option value="JUNIOR">JUNIOR</option>
                                            <option value="VIP">VIP</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Status</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                            value={editForm.status || ''}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AccountStatus })}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="SUSPENDED">SUSPENDED</option>
                                            <option value="IN_ARREARS">IN_ARREARS</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-white/10">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-black/20"
                                            checked={editForm.isLicenseHolder || false}
                                            onChange={(e) => setEditForm({ ...editForm, isLicenseHolder: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-300">Active License Holder</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-black/20"
                                            checked={editForm.isRegisteredShooter || false}
                                            onChange={(e) => setEditForm({ ...editForm, isRegisteredShooter: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-300">Registered Shooter (NRS)</span>
                                    </label>
                                </div>

                                {/* Uploaded Documents View with Privacy Controls */}
                                <div className="pt-4 border-t border-white/10 space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-400">Compliance Documents</h4>
                                        {selectedMember.licenseAccessGranted ? (
                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs">Access Granted</span>
                                        ) : (
                                            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-xs">Private</span>
                                        )}
                                    </div>

                                    {!selectedMember.licenseAccessGranted ? (
                                        <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-center">
                                            <Shield size={24} className="text-gray-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400 mb-3">
                                                This member has not granted staff access to view their documents.
                                            </p>
                                            <button
                                                onClick={handleRequestAccess}
                                                disabled={selectedMember.licenseAccessRequested || isRequestingAccess}
                                                className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-400 text-black text-sm font-semibold py-1.5 px-4 rounded-lg transition-colors w-full"
                                            >
                                                {selectedMember.licenseAccessRequested ? 'Access Requested ✓' : (isRequestingAccess ? 'Requesting...' : 'Request Access')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between bg-black/20 px-3 py-3 rounded border border-white/5">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <FileText size={16} className={selectedMember.certificateUrl ? "text-emerald-400" : "text-gray-600"} />
                                                    {selectedMember.certificateUrl ? (
                                                        <a href={selectedMember.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                                                            View Firearms Certificate
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-500">No Certificate Uploaded</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between bg-black/20 px-3 py-3 rounded border border-white/5">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <User size={16} className={selectedMember.profilePhotoUrl ? "text-emerald-400" : "text-gray-600"} />
                                                    {selectedMember.profilePhotoUrl ? (
                                                        <a href={selectedMember.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                                                            View Profile Photo
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-500">No Photo Uploaded</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-3 pt-6">
                                    <button
                                        onClick={() => setSelectedMember(null)}
                                        className="flex-1 py-2 px-4 rounded-xl font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 py-2 px-4 rounded-xl font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center text-gray-500 h-64 sticky top-24">
                            <User size={48} className="mb-4 opacity-20" />
                            <p>Select a member from the list to view and edit their details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
