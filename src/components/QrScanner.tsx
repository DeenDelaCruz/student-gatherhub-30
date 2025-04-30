
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { validateQrCodeData } from '@/utils/capacitorUtils';

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
  const { user } = useAuth();
  
  // Add a timeout ref to track and clear timeouts
  const timeoutRef = useRef<number | null>(null);

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
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(err => console.error("Error stopping scanner on unmount:", err));
      }
      
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

  const handleCancel = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
    
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

  const toggleUploadMode = () => {
    if (isProcessing) return;
    
    // Clear any existing scanner instance
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
    
    setIsUploadMode(true);
    setIsScanning(false);
    setError(null);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      // Reset state first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setError(null);
      
      const file = e.target.files?.[0];
      if (!file) {
        console.log("No file selected");
        setIsLocalProcessing(false);
        return;
      }

      console.log("File selected:", file.name, file.type, file.size);
      setIsLocalProcessing(true);
      
      // Check file type
      if (!file.type.includes('image/')) {
        setError("Please select an image file");
        toast.error("Invalid file type", {
          description: "Please select an image file"
        });
        setIsLocalProcessing(false);
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image is too large (maximum 5MB)");
        toast.error("File too large", {
          description: "Please select a smaller image (maximum 5MB)"
        });
        setIsLocalProcessing(false);
        return;
      }
      
      // Create a new scanner instance each time to avoid stale state
      if (scannerRef.current) {
        // Try to clean up the previous instance
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          scannerRef.current.clear();
        } catch (err) {
          console.error("Error cleaning up previous scanner:", err);
        }
      }
      
      console.log("Creating new scanner instance for file upload");
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      // Set a timeout to prevent indefinite processing
      timeoutRef.current = window.setTimeout(() => {
        if (isLocalProcessing) {
          console.log("QR scan timed out");
          setError("Scan timed out. Please try a clearer image.");
          toast.error("Scan timed out", {
            description: "Could not read QR code. Please try a clearer image."
          });
          setIsLocalProcessing(false);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }, 10000); // 10 second timeout
      
      console.log("Processing file upload:", file.name);
      
      // Create a file reader to pre-check the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Now attempt to scan the file
          scannerRef.current!.scanFile(file, true)
            .then(decodedText => {
              // Clear timeout since we got a result
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              console.log("QR Code from image detected:", decodedText);
              processQrData(decodedText);
            })
            .catch(err => {
              // Clear timeout since we got a result
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              console.error("Error scanning uploaded image:", err);
              setError("Could not find a valid QR code in the image");
              toast.error("QR scan failed", {
                description: "Could not find a valid QR code in the image"
              });
              setIsLocalProcessing(false);
            })
            .finally(() => {
              // Reset file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            });
        };
        img.onerror = () => {
          // Clear timeout since we got a result
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          console.error("Error loading image");
          setError("Error loading image. Please try another file.");
          toast.error("Image error", {
            description: "Could not load the selected image"
          });
          setIsLocalProcessing(false);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        // Clear timeout since we got a result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        console.error("Error reading file");
        setError("Error reading file. Please try another image.");
        toast.error("File error", {
          description: "Could not read the selected file"
        });
        setIsLocalProcessing(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      // Start reading the file
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Unexpected error in file upload:", err);
      setError("An unexpected error occurred");
      toast.error("Upload error", {
        description: "Failed to process the uploaded image"
      });
      setIsLocalProcessing(false);
      
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
