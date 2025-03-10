
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/input';

interface QrScannerProps {
  onScanComplete: (data: string) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const QrScanner = ({ onScanComplete, isProcessing, onCancel }: QrScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = "qr-reader-container";
  const { user, refreshProfileData } = useAuth();

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

  // First create a scanner reference then start the scan
  const initializeScanner = async () => {
    try {
      // Create scanner instance first
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
              
              // Ensure we're passing valid data to the onScanComplete callback
              if (typeof decodedText === 'string' && decodedText.trim()) {
                onScanComplete(decodedText.trim());
                
                // Refresh profile data after successful scan
                if (user) {
                  setTimeout(() => {
                    console.log("Refreshing profile data for user:", user.id);
                    refreshProfileData(user.id);
                  }, 2000); // Increased delay to allow check-in to complete
                }
              } else {
                setError("Invalid QR code data received");
              }
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
      console.error('Failed to initialize scanner:', err);
      setError(err.toString());
      setIsScanning(false);
    }
  };

  const startScan = () => {
    if (isProcessing) return;
    
    setIsScanning(true);
    setIsUploadMode(false);
    setError(null);
    
    // We'll handle the actual scanner initialization after the container is rendered
    // through the useEffect below
  };

  // This effect runs when isScanning changes to true, ensuring the DOM element exists
  useEffect(() => {
    if (isScanning) {
      // Give the DOM time to render the scanner container
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
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [isScanning]);

  const handleCancel = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
    setIsScanning(false);
    setIsUploadMode(false);
    onCancel();
  };

  const toggleUploadMode = () => {
    if (isProcessing) return;
    setIsUploadMode(true);
    setIsScanning(false);
    setError(null);
    
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLocalProcessing(true);
    
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
    }
    
    scannerRef.current.scanFile(file, true)
      .then(decodedText => {
        console.log("QR Code from image:", decodedText);
        
        // Ensure we're passing valid data to the onScanComplete callback
        if (typeof decodedText === 'string' && decodedText.trim()) {
          onScanComplete(decodedText.trim());
          
          // Refresh profile data after successful scan
          if (user) {
            setTimeout(() => {
              console.log("Refreshing profile data for user:", user.id);
              refreshProfileData(user.id);
            }, 2000); // Increased delay to allow check-in to complete
          }
        } else {
          setError("Invalid QR code data received from image");
        }
      })
      .catch(err => {
        console.error("Error scanning uploaded image:", err);
        setError("Could not find a valid QR code in the image");
      })
      .finally(() => {
        setIsLocalProcessing(false);
      });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
    <div className="scanner-viewport relative mb-6 rounded-xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
      {isProcessing || isLocalProcessing ? (
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
      ) : isUploadMode ? (
        <div className="flex flex-col items-center p-4">
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-400 mb-4">Upload a QR code image</p>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={triggerFileInput} className="w-full">
              Select Image
            </Button>
            
            <Button variant="outline" onClick={() => setIsUploadMode(false)}>
              Back
            </Button>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center p-4">
          {hasPermissions === false ? (
            <>
              <p className="text-red-500 mb-2">Camera permission denied</p>
              <p className="text-sm text-gray-500 mb-4">
                {error || "Please enable camera access in your browser settings or use image upload instead."}
              </p>
              <Button onClick={toggleUploadMode} className="mb-2">Upload QR Image</Button>
              <Button variant="outline" onClick={onCancel}>Go Back</Button>
            </>
          ) : (
            <>
              <Camera className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-400 mb-4">Choose scan method</p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={startScan} className="w-full">
                  Use Camera
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={toggleUploadMode}
                  className="w-full"
                >
                  Upload QR Image
                </Button>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QrScanner;
