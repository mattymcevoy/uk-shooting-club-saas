'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, XCircle, User, Calendar, CheckSquare, Target, BookOpen, Clock } from 'lucide-react';

type UserData = {
    id: string;
    name: string;
    membershipTier: string;
    isLicenseHolder: boolean;
    profilePhotoUrl: string | null;
    status: string;
    creditBalance: number;
};

type ItineraryItem = {
    id: string;
    facilityName: string;
    eventName?: string;
    startTime: string;
    endTime: string;
    status: string;
    squadNumber?: string;
    prePaidClays: number;
    prePaidLessons: boolean;
    checkedInAt?: string;
};

type ScanResult = {
    valid: boolean;
    user: UserData | null;
    itinerary: ItineraryItem[];
    message: string;
};

export default function StaffScanner() {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isScanning && !scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true
                },
                false
            );

            scannerRef.current.render(onScanSuccess, () => { });
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
        };
    }, [isScanning]);

    const onScanSuccess = async (decodedText: string) => {
        if (!isScanning) return;
        setIsScanning(false);
        if (scannerRef.current) scannerRef.current.pause(true);

        try {
            const res = await fetch('/api/admin/verify-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrHash: decodedText }) // Endpoint handles raw hash or json wrapper
            });

            const data = await res.json();

            if (res.ok) {
                setScanResult({
                    valid: true,
                    user: data.user,
                    itinerary: data.itinerary,
                    message: 'Member Verified'
                });
            } else {
                setScanResult({
                    valid: false,
                    user: null,
                    itinerary: [],
                    message: data.error || 'Invalid QR Code'
                });
            }
        } catch (e) {
            setScanResult({ valid: false, user: null, itinerary: [], message: 'Scan Error' });
        }
    };

    const handleCheckIn = async (bookingId: string) => {
        setIsCheckingIn(bookingId);
        try {
            const res = await fetch('/api/admin/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            if (res.ok) {
                // Update local state to show checked in
                if (scanResult) {
                    setScanResult({
                        ...scanResult,
                        itinerary: scanResult.itinerary.map(item =>
                            item.id === bookingId ? { ...item, status: 'ATTENDED', checkedInAt: new Date().toISOString() } : item
                        )
                    });
                }
            } else {
                alert('Failed to check member in.');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating check-in.');
        } finally {
            setIsCheckingIn(null);
        }
    };

    const resumeScanning = () => {
        setScanResult(null);
        setIsScanning(true);
        if (scannerRef.current) scannerRef.current.resume();
    };

    return (
        <div className="p-8 max-w-lg mx-auto font-sans min-h-screen">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-2">
                    Range Scanner
                </h1>
                <p className="text-gray-400 text-sm">Scan physical codes to verify active bookings.</p>
            </div>

            <div className={`rounded-3xl overflow-hidden shadow-2xl border-4 transition-colors duration-500 ${!scanResult ? 'border-emerald-500/30' : scanResult.valid ? 'border-emerald-500' : 'border-red-500'}`}>
                <div id="reader" className="w-full bg-black min-h-[300px]" style={{ display: isScanning ? 'block' : 'none' }}></div>

                {scanResult && (
                    <div className={`bg-gradient-to-b ${scanResult.valid ? 'from-emerald-950 to-black' : 'from-red-950 to-black'} text-white`}>
                        {/* Member Header */}
                        {scanResult.valid && scanResult.user ? (
                            <div className="p-6 border-b border-white/10 flex flex-col items-center">
                                {scanResult.user.profilePhotoUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={scanResult.user.profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto border-[3px] border-emerald-500 object-cover shadow-lg shadow-emerald-500/30 mb-4" />
                                ) : (
                                    <div className="w-24 h-24 bg-emerald-900/30 rounded-full mx-auto flex items-center justify-center border-[3px] border-emerald-500 mb-4">
                                        <User size={40} className="text-emerald-400" />
                                    </div>
                                )}
                                <h2 className="text-2xl font-black">{scanResult.user.name}</h2>
                                <p className="text-emerald-400 font-bold tracking-widest text-sm uppercase mt-1">{scanResult.user.membershipTier.replace('_', ' ')}</p>

                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Account</div>
                                        <div className={`font-bold ${scanResult.user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {scanResult.user.status}
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">License</div>
                                        <div className={`font-bold ${scanResult.user.isLicenseHolder ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {scanResult.user.isLicenseHolder ? 'VERIFIED' : 'PENDING'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold">{scanResult.message}</h2>
                            </div>
                        )}

                        {/* Itinerary Section */}
                        {scanResult.valid && (
                            <div className="p-6">
                                <h3 className="font-bold text-gray-400 mb-4 flex items-center">
                                    <Calendar className="mr-2" size={18} /> 48-Hour Itinerary
                                </h3>

                                <div className="space-y-4">
                                    {scanResult.itinerary.length === 0 ? (
                                        <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5">
                                            <p className="text-gray-400 text-sm">No active bookings found for today.</p>
                                        </div>
                                    ) : (
                                        scanResult.itinerary.map(item => (
                                            <div key={item.id} className={`p-5 rounded-xl border-l-[6px] bg-black/50 ${item.status === 'ATTENDED' ? 'border-l-gray-600 border-t border-r border-b border-t-white/5 border-r-white/5 border-b-white/5 opacity-75' : 'border-l-emerald-500 border-t border-r border-b border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20 shadow-lg shadow-emerald-900/10'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white leading-tight">
                                                            {item.eventName || item.facilityName}
                                                        </h4>
                                                        {item.squadNumber && (
                                                            <div className="text-teal-400 font-bold text-sm mt-1">Squad: {item.squadNumber}</div>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'ATTENDED' ? 'bg-gray-800 text-gray-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>

                                                <div className="text-gray-400 text-sm flex items-center mt-3">
                                                    <Clock size={14} className="mr-2 text-emerald-500" />
                                                    {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="mx-2 opacity-50">•</span>
                                                    {new Date(item.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>

                                                {/* Pre-paid Perks */}
                                                {(item.prePaidClays > 0 || item.prePaidLessons) && (
                                                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                                                        {item.prePaidClays > 0 && (
                                                            <div className="flex items-center text-xs font-bold bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-lg border border-amber-500/30">
                                                                <Target size={14} className="mr-1.5" />
                                                                {item.prePaidClays} Clays Pre-paid
                                                            </div>
                                                        )}
                                                        {item.prePaidLessons && (
                                                            <div className="flex items-center text-xs font-bold bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/30">
                                                                <BookOpen size={14} className="mr-1.5" />
                                                                Lesson Included
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="mt-5">
                                                    {item.status === 'ATTENDED' ? (
                                                        <div className="flex items-center justify-center w-full py-2.5 bg-gray-900 rounded-xl text-gray-500 text-sm font-bold border border-gray-800">
                                                            <ShieldCheck size={16} className="mr-2" />
                                                            Checked In {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCheckIn(item.id)}
                                                            disabled={isCheckingIn === item.id}
                                                            className="w-full font-bold py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center"
                                                        >
                                                            {isCheckingIn === item.id ? 'Processing...' : 'Check Member In'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-6 border-t border-white/10">
                            <button
                                onClick={resumeScanning}
                                className="w-full font-bold py-3 rounded-xl border-2 border-white/20 hover:bg-white/5 text-white transition-colors"
                            >
                                Scan Next Pass
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        #reader__dashboard_section_csr span { color: white !important; }
        #reader__dashboard_section_swaplink { color: #34d399 !important; text-decoration: none; }
        #reader button { 
             background-color: #059669 !important; 
             color: white !important; 
             border: none !important; 
             padding: 8px 16px !important; 
             border-radius: 8px !important; 
             font-weight: bold !important;
             margin-top: 10px !important;
        }
        #reader select {
             background-color: #1f2937 !important;
             color: white !important;
             border: 1px solid #374151 !important;
             border-radius: 8px !important;
             padding: 8px !important;
             margin-bottom: 10px !important;
        }
      `}} />
        </div>
    );
}
