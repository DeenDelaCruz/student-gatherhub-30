
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor/barcode-scanner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { 
  checkAndRequestCameraPermission,
  prepareScanner,
  stopScanner
} from '@/utils/capacitorUtils';

interface QrScannerProps {
  onScanComplete: (data: string) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const QrScanner = ({ onScanComplete, isProcessing, onCancel }: QrScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        const permissionGranted = await checkAndRequestCameraPermission();
        setHasPermission(permissionGranted);
      } else {
        // Web platform doesn't need the same permissions
        setHasPermission(true);
      }
    };

    checkPermissions();

    // Clean up scanner when component unmounts
    return () => {
      if (isScanning) {
        stopScanner();
      }
    };
  }, []);

  const startScan = async () => {
    if (isProcessing) return;
    
    try {
      setIsScanning(true);
      
      if (Capacitor.isNativePlatform()) {
        // Prepare UI for scanner
        prepareScanner();
        
        // Start the scanner
        const result = await BarcodeScanner.startScan();
        
        // If user didn't cancel scanning
        if (result.hasContent) {
          onScanComplete(result.content);
        }
      } else {
        // Web fallback - simulate a scan for testing
        setTimeout(() => {
          onScanComplete(JSON.stringify({ eventId: "web-fallback-event-id" }));
        }, 2000);
      }
    } catch (error) {
      console.error('Scanning failed:', error);
    } finally {
      setIsScanning(false);
      if (Capacitor.isNativePlatform()) {
        stopScanner();
      }
    }
  };

  const handleCancel = () => {
    if (Capacitor.isNativePlatform() && isScanning) {
      BarcodeScanner.stopScan();
      stopScanner();
    }
    setIsScanning(false);
    onCancel();
  };

  if (hasPermission === null) {
    return (
      <div className="text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Checking camera permissions...</p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">Camera permission denied</p>
        <p className="text-sm text-gray-500 mb-4">
          Please enable camera access in your device settings to scan QR codes.
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
        Capacitor.isNativePlatform() ? (
          <div className="scanner-layer">
            <div className="scanner-ui">
              <p className="scanner-instructions">Position the QR code within the frame</p>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Scanning...</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-gray-400 mb-4">Tap to activate camera</p>
          <Button onClick={startScan}>Start Scanning</Button>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
