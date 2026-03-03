'use client';

import { useState, useRef, useEffect } from 'react';
import { upload } from '@vercel/blob/client';
import { CheckCircle, UploadCloud, Camera, User, FileText, ChevronRight, X, Aperture } from 'lucide-react';
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
        membershipTier: '', // Now stores the dynamic Plan ID
        billingCycle: 'monthly' as 'monthly' | 'annual'
    });

    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        // Fetch dynamic membership tiers
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/admin/settings/pricing');
                const data = await res.json();
                setPlans(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, membershipTier: data[0].id }));
                }
            } catch (err) {
                console.error("Failed to load plans", err);
            }
        };
        fetchPlans();
    }, []);

    // File State
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [certificateDoc, setCertificateDoc] = useState<File | null>(null);

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Camera Integration State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Ensure camera turns off if component unmounts
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setIsCameraOpen(true);
            // small delay to let the UI mount the <video> tag
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Could not access camera. Please allow permissions or use manual upload.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setProfilePhoto(file);
                        setPhotoPreview(URL.createObjectURL(file));
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

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
                            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 text-center relative border-emerald-100 transition-colors">

                                {isCameraOpen ? (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-emerald-500 shadow-xl bg-black">
                                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                            <video ref={videoRef} className="w-full h-auto aspect-square object-cover transform scale-x-[-1]" autoPlay playsInline disablePictureInPicture />
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>
                                        <div className="flex justify-center space-x-4">
                                            <button type="button" onClick={stopCamera} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                                                Cancel
                                            </button>
                                            <button type="button" onClick={capturePhoto} className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                                                <Aperture size={20} />
                                                <span>Snap Photo</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {photoPreview ? (
                                            <div className="space-y-4">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-emerald-500 shadow-xl" />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                                                    <Camera size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">Profile Photo</h4>
                                                    <p className="text-sm text-gray-500 mt-1">Required for digital membership card</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-center space-x-4">
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors"
                                            >
                                                {photoPreview ? 'Retake Photo' : 'Open Camera'}
                                            </button>

                                            <label className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                                                <span>Upload File</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                            </label>
                                        </div>
                                    </div>
                                )}
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
                                {plans.length === 0 ? (
                                    <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                                        No membership plans are currently available. Please contact the club.
                                    </div>
                                ) : (
                                    plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, membershipTier: plan.id })}
                                            className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${formData.membershipTier === plan.id
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className={`font-bold text-lg ${formData.membershipTier === plan.id ? 'text-emerald-900' : 'text-gray-900'}`}>{plan.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-extrabold text-xl ${formData.membershipTier === plan.id ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                        £{((formData.billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice) / 100).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
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
