
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  validateQrCodeData, 
  isImageFile,
  isHeicHeifFile,
  createImageFromFile,
  resizeImage,
  isMobileDevice,
  checkAndRequestStoragePermission,
  processImageWithMultipleApproaches
} from '@/utils/capacitorUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QrScannerProps {
  onScanComplete: (data: string) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const QrScanner = ({ onScanComplete, isProcessing, onCancel }: QrScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [hasStoragePermissions, setHasStoragePermissions] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          setIsLocalProcessing(false);
        }
      } else {
        setError("Invalid QR code data received");
        toast.error("Invalid QR code", {
          description: "The QR code didn't contain valid data"
        });
        setIsLocalProcessing(false);
      }
    } catch (err) {
      console.error("Error in processQrData:", err);
      setError("Failed to process QR code");
      toast.error("Processing error", {
        description: "Failed to process the QR code data"
      });
      setIsLocalProcessing(false);
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
    setIsUploadMode(false);
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
    setIsUploadMode(false);
    setIsLocalProcessing(false);
    setError(null);
    onCancel();
  };

  const toggleUploadMode = async () => {
    if (isProcessing) return;
    
    // Clean up any existing scanner instance
    await cleanupScanner();
    
    // Check for storage permission before entering upload mode
    const hasPermission = await checkAndRequestStoragePermission();
    
    if (hasPermission) {
      setIsUploadMode(true);
      setIsScanning(false);
      setError(null);
      setHasStoragePermissions(true);
    } else {
      setHasStoragePermissions(false);
      setShowPermissionDialog(true);
      toast.error("Storage permission required", {
        description: "Please allow storage access to upload QR code images"
      });
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered");
    
    // Reset states
    setError(null);
    setIsLocalProcessing(true);
    
    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to prevent infinite processing
    timeoutRef.current = window.setTimeout(() => {
      if (isLocalProcessing) {
        console.log("Upload processing timeout triggered");
        setIsLocalProcessing(false);
        setError("Processing timed out. Please try another image.");
        toast.error("Upload timed out", {
          description: "Unable to process the image in a reasonable time"
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }, 20000); // 20 second timeout (extended for better compatibility)
    
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      setIsLocalProcessing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    
    console.log("File selected:", file.name, file.type, file.size);
    
    // Check if it's an image file
    if (!isImageFile(file)) {
      setError("Please select an image file");
      toast.error("Invalid file type", {
        description: "Please select an image file"
      });
      setIsLocalProcessing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // File size check (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      setError("Image is too large (maximum 25MB)");
      toast.error("File too large", {
        description: "Please select a smaller image (maximum 25MB)"
      });
      setIsLocalProcessing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // HEIC/HEIF file handling - provide specific message
    if (isHeicHeifFile(file)) {
      setError("HEIC/HEIF images cannot be processed directly. Please convert to JPEG or PNG before uploading.");
      toast.error("Unsupported format", {
        description: "HEIC/HEIF images need to be converted to JPEG or PNG format first."
      });
      setIsLocalProcessing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    try {
      // Ensure we have a clean scanner instance
      await cleanupScanner();
      
      // Create a new scanner instance
      const html5QrCode = new Html5Qrcode(scannerContainerId, { verbose: isMobileDevice() ? false : true });
      scannerRef.current = html5QrCode;
      
      console.log("Processing image with enhanced approaches");
      toast.info("Processing image", {
        description: "Trying multiple methods to scan the QR code..."
      });
      
      const decodedText = await processImageWithMultipleApproaches(file, html5QrCode);
      
      console.log("QR code successfully found in image:", decodedText);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsLocalProcessing(false);
      processQrData(decodedText);
      
      // Clean up resources
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Error scanning QR code from image:", error);
      
      setError("Could not detect a valid QR code in this image. Please try a clearer image or different angle.");
      toast.error("No QR code found", {
        description: "The image doesn't contain a valid QR code or we couldn't read it. Try a clearer image with good lighting."
      });
      
      setIsLocalProcessing(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const retryStoragePermission = async () => {
    const hasPermission = await checkAndRequestStoragePermission();
    if (hasPermission) {
      setHasStoragePermissions(true);
      setShowPermissionDialog(false);
      setIsUploadMode(true);
    } else {
      toast.error("Storage access denied", {
        description: "Please enable storage access in your device settings"
      });
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
    <>
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
      
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Storage Permission Required</DialogTitle>
            <DialogDescription>
              We need access to your device storage to upload QR code images. Please grant permission to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>Cancel</Button>
            <Button onClick={retryStoragePermission}>Grant Permission</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QrScanner;
