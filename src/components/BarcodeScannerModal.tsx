import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from './icons/HeroIcons';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (scannedCode: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerRegionId = "html5qr-code-full-region";

    useEffect(() => {
        if (!isOpen) {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
                scannerRef.current = null;
            }
            return;
        }

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerRegionId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText, decodedResult) => {
                        // Handle success
                        console.log(`Code matched = ${decodedText}`, decodedResult);
                        onScanSuccess(decodedText);
                        // Stop scanning after success if desired, or keep scanning
                        // For this app, we probably want to close or at least stop triggering multiple times quickly
                        // But the parent handles closing, so we just callback.
                        // To prevent multiple rapid callbacks, we could pause here, but let's rely on parent closing it.
                    },
                    (errorMessage) => {
                        // parse error, ignore it.
                        // console.log(errorMessage);
                    }
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                setError("Could not start camera. Please ensure you have given permission.");
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    scannerRef.current = null;
                }).catch(err => {
                    console.error("Failed to stop scanner cleanup", err);
                });
            }
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">Scan Barcode / QR Code</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4 bg-black relative min-h-[300px] flex items-center justify-center">
                    <div id={scannerRegionId} className="w-full"></div>
                    {error && <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">{error}</div>}
                </div>
                <div className="bg-background px-4 py-3 sm:px-6 flex justify-end items-center rounded-b-lg">
                    <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;