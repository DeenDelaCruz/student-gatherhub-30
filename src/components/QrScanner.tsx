
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X } from 'lucide-react';

interface QrScannerProps {
  onScanComplete: (data: string) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const QrScanner = ({ onScanComplete, isProcessing, onCancel }: QrScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  useEffect(() => {
    // Check camera permissions
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(() => {
        setHasPermissions(true);
      })
      .catch((err) => {
        console.error('Camera permission error:', err);
        setHasPermissions(false);
        setError('Camera access was denied or is not available');
      });
      
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, []);

  const startScan = async () => {
    if (isProcessing) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      // Make sure we have a valid container element
      const scannerContainer = document.getElementById(scannerContainerId);
      if (!scannerContainer) {
        throw new Error("Scanner container not found");
      }
      
      // Create scanner instance
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1
      };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          // Success callback
          console.log("QR Code detected:", decodedText);
          html5QrCode.stop()
            .then(() => {
              setIsScanning(false);
              onScanComplete(decodedText);
            })
            .catch(err => console.error("Error stopping scanner after success:", err));
        },
        (errorMessage) => {
          // Error callback - we'll just log it without showing to user
          // as this gets called frequently during scanning
          console.log("QR Code scanning in progress:", errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.toString());
      setIsScanning(false);
    }
  };

  const handleCancel = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
    setIsScanning(false);
    onCancel();
  };

  if (hasPermissions === null) {
    return (
      <div className="text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Checking camera permissions...</p>
      </div>
    );
  }

  if (hasPermissions === false) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">Camera permission denied</p>
        <p className="text-sm text-gray-500 mb-4">
          {error || "Please enable camera access in your browser settings to scan QR codes."}
        </p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="scanner-viewport relative mb-6 rounded-xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
      {isProcessing ? (
        <div className="text-gray-500 flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Processing...</p>
        </div>
      ) : isScanning ? (
        <div className="relative w-full h-full flex flex-col items-center">
          <div 
            id={scannerContainerId} 
            className="w-full h-full"
          ></div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg"></div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="absolute bottom-4 bg-white"
          >
            <X className="mr-1" size={16} />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Camera className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-400 mb-4">Tap to activate camera</p>
          <Button onClick={startScan}>Start Scanning</Button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default QrScanner;
