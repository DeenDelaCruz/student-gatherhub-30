
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import { 
  validateQrCodeData,
  checkAndRequestCameraPermission
} from '@/utils/capacitorUtils';

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
  const { user } = useAuth();
  
  // Add a timeout ref to track and clear timeouts
  const timeoutRef = useRef<number | null>(null);

  // Cleanup function to ensure we properly stop scanner instances
  const cleanupScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
        console.log("Cleaning up scanner instance");
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("Error cleaning up scanner:", err);
    }
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(() => {
        setHasPermissions(true);
      })
      .catch((err) => {
        console.error('Camera permission error:', err);
        setHasPermissions(false);
        setError('Camera access was denied or is not available');
      });
      
    return () => {
      // Clean up scanner when component unmounts
      cleanupScanner();
      
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processQrData = (decodedText: string) => {
    console.log("Processing QR data:", decodedText);
    
    try {
      if (typeof decodedText === 'string' && decodedText.trim()) {
        // Validate QR code format
        if (validateQrCodeData(decodedText.trim())) {
          onScanComplete(decodedText.trim());
        } else {
          setError("Invalid QR code format for event check-in");
          toast.error("Invalid QR code", {
            description: "This QR code is not in the correct format for event check-in"
          });
        }
      } else {
        setError("Invalid QR code data received");
        toast.error("Invalid QR code", {
          description: "The QR code didn't contain valid data"
        });
      }
    } catch (err) {
      console.error("Error in processQrData:", err);
      setError("Failed to process QR code");
      toast.error("Processing error", {
        description: "Failed to process the QR code data"
      });
    }
  };

  const initializeScanner = async () => {
    try {
      // Ensure any existing scanner is cleaned up first
      await cleanupScanner();
      
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
          console.log("QR Code detected:", decodedText);
          html5QrCode.stop()
            .then(() => {
              setIsScanning(false);
              processQrData(decodedText);
            })
            .catch(err => console.error("Error stopping scanner after success:", err));
        },
        (errorMessage) => {
          console.log("QR Code scanning in progress:", errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Failed to initialize scanner:', err);
      setError(err.toString());
      setIsScanning(false);
      toast.error("Scanner error", {
        description: "Failed to initialize scanner. Please try again."
      });
    }
  };

  const startScan = () => {
    if (isProcessing) return;
    
    setIsScanning(true);
    setError(null);
  };

  useEffect(() => {
    if (isScanning) {
      setTimeout(() => {
        const scannerContainer = document.getElementById(scannerContainerId);
        
        if (!scannerContainer) {
          console.error("Scanner container not found after render");
          setError("Could not initialize camera. Please try again.");
          setIsScanning(false);
          return;
        }
        
        initializeScanner().catch(err => {
          console.error("Failed to start scanner:", err);
          setError(err.toString());
          setIsScanning(false);
        });
      }, 100);
    }
  }, [isScanning]);

  const handleCancel = async () => {
    await cleanupScanner();
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsScanning(false);
    setError(null);
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

  return (
    <>
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
          <div className="flex flex-col items-center p-4">
            {hasPermissions === false ? (
              <>
                <p className="text-red-500 mb-2">Camera permission denied</p>
                <p className="text-sm text-gray-500 mb-4">
                  {error || "Please enable camera access in your browser settings."}
                </p>
                <Button variant="outline" onClick={onCancel}>Go Back</Button>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-400 mb-4">Scan QR code with camera</p>
                
                <Button onClick={startScan} className="w-full max-w-xs">
                  Start Scanning
                </Button>
                
                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default QrScanner;
