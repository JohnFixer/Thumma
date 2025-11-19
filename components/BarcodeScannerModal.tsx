import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import path to include file extension.
import { XMarkIcon } from './icons/HeroIcons.tsx';

declare global {
    interface Window {
        BarcodeDetector: any;
    }
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }

        const startScan = async () => {
            if (!('BarcodeDetector' in window)) {
                setError('Barcode Detector is not supported by this browser.');
                setStatus('Not supported');
                return;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Camera access is not supported by this browser.');
                setStatus('Not supported');
                return;
            }

            try {
                setStatus('Requesting camera access...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                
                setStatus('Scanning for codes...');
                const barcodeDetector = new window.BarcodeDetector();
                
                const intervalId = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState < 2) {
                        return;
                    }
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            clearInterval(intervalId);
                            stopStream();
                            onScanSuccess(barcodes[0].rawValue);
                        }
                    } catch (e) {
                         console.error('Detection error:', e);
                    }
                }, 200);

                return () => {
                    clearInterval(intervalId);
                    stopStream();
                };

            } catch (err) {
                console.error('Error accessing camera:', err);
                setError('Could not access the camera. Please check permissions.');
                setStatus('Permission denied');
                stopStream();
            }
        };

        startScan();

        return () => {
           stopStream();
        }
    }, [isOpen, onScanSuccess]);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }


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
        <div className="p-4 relative bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full" playsInline />
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full h-1/2 border-4 border-dashed border-white/50 rounded-lg"></div>
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-between items-center rounded-b-lg">
           <p className="text-sm text-text-secondary italic">{status}</p>
           {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
           <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;