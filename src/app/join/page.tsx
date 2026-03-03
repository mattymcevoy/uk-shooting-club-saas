'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { CheckCircle, UploadCloud, Camera, User, FileText, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JoinUs() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        certificateNumber: '',
        membershipTier: 'FULL_MEMBER',
        billingCycle: 'monthly' // or 'annual'
    });

    // File State
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [certificateDoc, setCertificateDoc] = useState<File | null>(null);

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCertificateDoc(e.target.files[0]);
        }
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            // In a real production app, we would upload to Vercel Blob here first
            // and get the URLs before sending to our backend.
            /* 
            const photoUploadUrl = profilePhoto ? await upload(profilePhoto.name, profilePhoto, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            }) : null;

            const certUploadUrl = certificateDoc ? await upload(certificateDoc.name, certificateDoc, {
                access: 'private', // Certificates should be private
                handleUploadUrl: '/api/upload',
            }) : null;
            */

            // Simulated upload URLs for the sake of the demo
            const photoUploadUrl = profilePhoto ? `https://mock.blob.vercel-storage.com/${profilePhoto.name}` : null;
            const certUploadUrl = certificateDoc ? `https://mock.blob.vercel-storage.com/${certificateDoc.name}` : null;

            const res = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    profilePhotoUrl: photoUploadUrl,
                    certificateUrl: certUploadUrl
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to register');
            }

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                router.push('/dashboard');
            }

        } catch (err: any) {
            setErrorMsg(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">
                        Join the UK Shooting Club
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Step {step} of 3 • {
                        step === 1 ? 'Personal Details' : step === 2 ? 'Documents & Photos' : 'Select Membership'
                    }</p>
                </div>

                <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="mt-8 space-y-6">

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center">
                            {errorMsg}
                        </div>
                    )}

                    {/* STEP 1: Personal Details */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+44 7700 900000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Postal Address</label>
                                <textarea required rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="123 Example Street&#10;London&#10;SW1A 1AA" />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Documents */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                            {/* Camera / Photo Upload */}
                            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 text-center relative hover:border-emerald-400 transition-colors">
                                <label className="cursor-pointer block">
                                    {photoPreview ? (
                                        <div className="space-y-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-emerald-500 shadow-xl" />
                                            <span className="text-emerald-600 font-bold text-sm block">Change Photo</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                                <Camera size={32} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">Profile Photo</h4>
                                                <p className="text-sm text-gray-500 mt-1">Take a selfie or upload a headshot</p>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} required />
                                </label>
                            </div>

                            {/* Certificate Upload */}
                            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 hover:border-emerald-400 transition-colors">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Gun Certificate Number</label>
                                    <input type="text" value={formData.certificateNumber} onChange={e => setFormData({ ...formData, certificateNumber: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none mb-4" placeholder="CERT-XXXXX" />
                                </div>
                                <label className="cursor-pointer flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800">Upload Gun Certificate</h4>
                                            <p className="text-xs text-gray-500">{certificateDoc ? certificateDoc.name : 'PDF or Image (Max 5MB)'}</p>
                                        </div>
                                    </div>
                                    <UploadCloud className="text-emerald-500" />
                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocChange} />
                                </label>
                            </div>

                        </div>
                    )}

                    {/* STEP 3: Membership Selection */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4 bg-gray-100 p-1.5 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                                    className={`py-3 text-sm font-bold rounded-xl transition-all ${formData.billingCycle === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, billingCycle: 'annual' })}
                                    className={`py-3 text-sm font-bold rounded-xl transition-all ${formData.billingCycle === 'annual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Annual <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1 uppercase">Save 20%</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Full Member Option */}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, membershipTier: 'FULL_MEMBER' })}
                                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${formData.membershipTier === 'FULL_MEMBER' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">Full Membership</h3>
                                            <p className="text-sm text-gray-500 mt-1">Complete facility access and discounted peg rates.</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-extrabold text-xl text-emerald-600">
                                                {formData.billingCycle === 'monthly' ? '£45' : '£450'}
                                            </div>
                                            <div className="text-xs text-gray-400">/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                                        </div>
                                    </div>
                                </button>

                                {/* VIP Option */}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, membershipTier: 'VIP' })}
                                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${formData.membershipTier === 'VIP' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-purple-900">VIP Membership</h3>
                                            <p className="text-sm text-gray-500 mt-1">Priority booking, complimentary guest passes.</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-extrabold text-xl text-purple-600">
                                                {formData.billingCycle === 'monthly' ? '£100' : '£1000'}
                                            </div>
                                            <div className="text-xs text-gray-400">/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}


                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button type="button" onClick={handlePrev} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800 transition-colors">
                                Back
                            </button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button type="submit" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center space-x-2">
                                <span>Continue</span>
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button disabled={loading} type="submit" className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center space-x-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Proceed to Payment</span>
                                        <CheckCircle size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>

            </div>
        </div>
    );
}
