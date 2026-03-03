'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, XCircle, User, Calendar, CheckSquare } from 'lucide-react';

type ScanResult = {
    valid: boolean;
    type: string;
    data: any;
    message: string;
};

export default function StaffScanner() {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Only initialize the scanner if we are actively scanning and it hasn't been created yet
        if (isScanning && !scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true
                },
            /* verbose= */ false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner", error);
                });
                scannerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    const onScanSuccess = async (decodedText: string) => {
        if (!isScanning) return; // Prevent double scanning

        setIsScanning(false);

        if (scannerRef.current) {
            scannerRef.current.pause(true); // Pause the camera view
        }

        try {
            const payload = JSON.parse(decodedText);

            // Verify with the backend API
            const res = await fetch('/api/admin/verify-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setScanResult({
                    valid: true,
                    type: payload.type,
                    data: data.record,
                    message: 'Valid Pass'
                });
            } else {
                setScanResult({
                    valid: false,
                    type: payload.type || 'UNKNOWN',
                    data: null,
                    message: data.error || 'Invalid or Expired QR Code'
                });
            }
        } catch (e) {
            setScanResult({
                valid: false,
                type: 'INVALID_FORMAT',
                data: null,
                message: 'Unrecognized QR Code format'
            });
        }
    };

    const onScanFailure = (error: any) => {
        // html5-qrcode throws errors constantly while searching for a code, we just ignore them
    };

    const resumeScanning = () => {
        setScanResult(null);
        setIsScanning(true);
        if (scannerRef.current) {
            scannerRef.current.resume();
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto font-sans min-h-screen">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-2">
                    Range Officer Scanner
                </h1>
                <p className="text-gray-400 text-sm">Scan Member Profiles and Event Bookings to verify facility access.</p>
            </div>

            {/* Scanner Viewport */}
            <div className={`rounded-3xl overflow-hidden shadow-2xl border-4 transition-colors duration-500 ${!scanResult ? 'border-emerald-500/30' : scanResult.valid ? 'border-emerald-500' : 'border-red-500'}`}>

                <div id="reader" className="w-full bg-black min-h-[300px]" style={{ display: isScanning ? 'block' : 'none' }}></div>

                {/* Result Overlay */}
                {scanResult && (
                    <div className={`p-8 bg-gradient-to-b ${scanResult.valid ? 'from-emerald-900/40 to-black' : 'from-red-900/40 to-black'} text-white`}>

                        <div className="flex flex-col items-center text-center">
                            {scanResult.valid ? (
                                <ShieldCheck size={64} className="text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                            ) : (
                                <XCircle size={64} className="text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            )}

                            <h2 className="text-2xl font-black mb-1">{scanResult.message}</h2>
                            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">{scanResult.type.replace('_', ' ')}</p>

                            {/* Booking Specific Data */}
                            {scanResult.valid && scanResult.type === 'BOOKING_VERIFICATION' && scanResult.data && (
                                <div className="mt-8 w-full bg-black/40 rounded-xl p-4 border border-white/5 text-left border-l-4 border-l-emerald-500">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <User className="text-emerald-500" size={18} />
                                        <span className="font-medium text-lg">{scanResult.data.user?.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 mb-3">
                                        <CheckSquare className="text-emerald-500" size={18} />
                                        <span className="font-medium">{scanResult.data.facility?.name}</span>
                                    </div>
                                    <div className="flex items-start space-x-3 text-gray-400 text-sm">
                                        <Calendar className="mt-0.5 text-emerald-500" size={18} />
                                        <div>
                                            <div>{new Date(scanResult.data.startTime).toLocaleDateString()}</div>
                                            <div className="text-white font-bold mt-1">
                                                {new Date(scanResult.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(scanResult.data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Profile Specific Data */}
                            {scanResult.valid && scanResult.type === 'MEMBERSHIP_VERIFICATION' && scanResult.data && (
                                <div className="mt-8 w-full bg-black/40 rounded-xl p-4 border border-white/5 text-left border-l-4 border-l-emerald-500">
                                    <div className="text-center mb-4">
                                        {scanResult.data.profilePhotoUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={scanResult.data.profilePhotoUrl} alt="Profile" className="w-20 h-20 rounded-full mx-auto border-2 border-emerald-500 object-cover" />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500">
                                                <User size={32} className="text-gray-400" />
                                            </div>
                                        )}
                                        <h3 className="text-xl font-bold mt-3">{scanResult.data.name}</h3>
                                        <p className="text-emerald-400 text-sm font-bold tracking-wide">{scanResult.data.membershipTier}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-center">
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <div className="text-gray-500 mb-1">Status</div>
                                            <div className={`font-bold ${scanResult.data.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {scanResult.data.status}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <div className="text-gray-500 mb-1">License</div>
                                            <div className="font-bold text-white">
                                                {scanResult.data.isLicenseHolder ? 'YES' : 'NO'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={resumeScanning}
                                className={`mt-8 w-full font-bold py-4 rounded-xl transition-all ${scanResult.valid ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                            >
                                Scan Next Pass
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Fallback styling for the HTML5-QRCode injected elements */}
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
