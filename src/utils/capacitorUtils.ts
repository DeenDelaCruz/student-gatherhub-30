
import { Capacitor } from '@capacitor/core';
import { Html5QrcodeScannerState } from 'html5-qrcode';

/**
 * Checks and requests camera permissions for barcode scanning
 * @returns Promise resolving to boolean indicating if permission was granted
 */
export const checkAndRequestCameraPermission = async (): Promise<boolean> => {
  try {
    // Using navigator.mediaDevices API instead of Capacitor
    await navigator.mediaDevices.getUserMedia({ video: true });
    return true;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Checks and requests storage permissions for file access
 * @returns Promise resolving to boolean indicating if permission was granted
 */
export const checkAndRequestStoragePermission = async (): Promise<boolean> => {
  try {
    // For web, we don't need explicit storage permission as file upload dialog handles this
    // This is a placeholder for when we implement native mobile functionality
    return true;
  } catch (error) {
    console.error('Error checking storage permission:', error);
    return false;
  }
};

/**
 * Prepares the app UI for barcode scanning (hides web content)
 * This is a no-op in the web version
 */
export const prepareScanner = () => {
  // No operation needed for web implementation
  console.log('Scanner preparation not needed for web implementation');
};

/**
 * Restores the app UI after barcode scanning (shows web content)
 * This is a no-op in the web version
 */
export const stopScanner = () => {
  // No operation needed for web implementation
  console.log('Scanner cleanup not needed for web implementation');
};

/**
 * Validates the format of a QR code data string for event check-in
 * @param qrData The QR code data string to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateQrCodeData = (qrData: string): boolean => {
  try {
    // Try to parse the QR code data as JSON
    const parsed = JSON.parse(qrData);
    
    // Valid event QR codes should have an eventId property
    return typeof parsed === 'object' && parsed !== null && 'eventId' in parsed;
  } catch (error) {
    // If parsing fails, the QR code data is not in the expected format
    console.log('QR validation error:', error);
    console.log('Failed QR data:', qrData);
    return false;
  }
};

/**
 * Safely extracts data from a QR code scan
 * @param qrData The raw QR code data string 
 * @returns The extracted data object or null if invalid
 */
export const extractQrCodeData = (qrData: string): { eventId: string } | null => {
  try {
    const parsed = JSON.parse(qrData);
    if (typeof parsed === 'object' && parsed !== null && 'eventId' in parsed) {
      return { eventId: parsed.eventId };
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Helper function to check if a file is an image
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  // Check by MIME type first
  if (file.type.startsWith('image/')) {
    return true;
  }
  
  // Also check by extension for cases where MIME type might not be detected correctly
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  return imageExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
};

/**
 * Helper function to check if a file is a HEIC/HEIF image
 * @param file The file to check
 * @returns Boolean indicating if the file is a HEIC/HEIF image
 */
export const isHeicHeifFile = (file: File): boolean => {
  return file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif') || 
         file.type === 'image/heic' || 
         file.type === 'image/heif';
};

/**
 * Helper function to create image element from File for QR scanning
 * @param file The image file
 * @returns Promise resolving to HTMLImageElement
 */
export const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Helper function to resize an image to reduce processing burden
 * @param img The image element to resize
 * @param maxDimension Maximum width or height
 * @returns Canvas element containing the resized image
 */
export const resizeImage = (img: HTMLImageElement, maxDimension = 1000): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;
  
  // Calculate new dimensions while maintaining aspect ratio
  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

/**
 * Helper function to determine if a browser is mobile
 * @returns Boolean indicating if the browser is on a mobile device
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

/**
 * Enhanced image processing: Apply various image transformations to improve QR detection
 * @param img The image to process
 * @returns Array of canvases with different processing applied
 */
export const applyImageProcessing = (img: HTMLImageElement): HTMLCanvasElement[] => {
  const processedCanvases: HTMLCanvasElement[] = [];
  
  // Canvas 1: Original resized image (medium resolution)
  const canvas1 = resizeImage(img, 800);
  processedCanvases.push(canvas1);
  
  // Canvas 2: High contrast version
  const canvas2 = document.createElement('canvas');
  canvas2.width = img.width;
  canvas2.height = img.height;
  const ctx2 = canvas2.getContext('2d');
  if (ctx2) {
    ctx2.filter = 'contrast(1.5) brightness(1.2)';
    ctx2.drawImage(img, 0, 0);
    processedCanvases.push(canvas2);
  }
  
  // Canvas 3: Grayscale version
  const canvas3 = document.createElement('canvas');
  canvas3.width = img.width;
  canvas3.height = img.height;
  const ctx3 = canvas3.getContext('2d');
  if (ctx3) {
    ctx3.filter = 'grayscale(1)';
    ctx3.drawImage(img, 0, 0);
    processedCanvases.push(canvas3);
  }
  
  // Canvas 4: High resolution version
  const canvas4 = resizeImage(img, 1200);
  processedCanvases.push(canvas4);
  
  // Canvas 5: Low resolution version for challenging images
  const canvas5 = resizeImage(img, 400);
  processedCanvases.push(canvas5);
  
  // Canvas 6: Sharpened version
  const canvas6 = document.createElement('canvas');
  canvas6.width = img.width;
  canvas6.height = img.height;
  const ctx6 = canvas6.getContext('2d');
  if (ctx6) {
    // Apply a simple sharpening algorithm
    ctx6.drawImage(img, 0, 0);
    const imageData = ctx6.getImageData(0, 0, canvas6.width, canvas6.height);
    const data = imageData.data;
    
    // Simple sharpening: increase contrast between adjacent pixels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * 1.2 - 20));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.2 - 20)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.2 - 20)); // B
    }
    
    ctx6.putImageData(imageData, 0, 0);
    processedCanvases.push(canvas6);
  }
  
  return processedCanvases;
};

/**
 * Try multiple approaches to process an image for QR scanning
 * This function takes an image file and tries different image processing
 * techniques to improve QR code detection chances.
 * 
 * @param file The image file to process
 * @param scanner The Html5Qrcode instance
 * @returns Promise resolving to scan result
 */
export const processImageWithMultipleApproaches = async (file: File, scanner: any): Promise<string> => {
  console.log("Attempting to process image with enhanced techniques");
  
  try {
    // First try: Direct file scan with aggressive config
    try {
      console.log("Approach 1: Direct file scan with adjusted config");
      
      // Start with direct scan but with enhanced configuration
      const config = { 
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true 
        } 
      };
      
      const result = await scanner.scanFileV2(file, config);
      if (result && result.decodedText) {
        console.log("Direct file scan successful with adjusted config");
        return result.decodedText;
      }
    } catch (err) {
      console.log("Direct scan failed, trying alternative methods");
    }
    
    // Load the image for processing
    const img = await createImageFromFile(file);
    console.log("Image loaded, dimensions:", img.width, "x", img.height);
    
    // Try different processed versions of the image
    const processedCanvases = applyImageProcessing(img);
    console.log(`Generated ${processedCanvases.length} processed versions of the image`);
    
    // Try each processed canvas
    let scanAttempt = 0;
    for (const canvas of processedCanvases) {
      scanAttempt++;
      try {
        console.log(`Approach ${scanAttempt+1}: Trying processed image variation`);
        
        // Convert canvas to a file
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const processedFile = new File([blob], `processed-image-${scanAttempt}.jpg`, { type: "image/jpeg" });
        
        // Attempt to scan with both APIs
        const configs = [
          { experimentalFeatures: { useBarCodeDetectorIfSupported: false } },
          { experimentalFeatures: { useBarCodeDetectorIfSupported: true } },
        ];
        
        for (const config of configs) {
          try {
            const result = await scanner.scanFileV2(processedFile, config);
            if (result && result.decodedText) {
              console.log(`Successful scan with processed image ${scanAttempt}`);
              return result.decodedText;
            }
          } catch (innerErr) {
            // Continue to next config
          }
        }
      } catch (err) {
        console.log(`Failed with processed image ${scanAttempt}:`, err);
      }
    }
    
    // Try splitting the image into segments for QR codes that may be smaller or in corners
    try {
      console.log("Approach 8: Analyzing image segments");
      
      // Create a smaller version to work with
      const workingCanvas = resizeImage(img, 800);
      const segments = [
        // Top-left quadrant
        { x: 0, y: 0, width: workingCanvas.width/2, height: workingCanvas.height/2 },
        // Top-right quadrant
        { x: workingCanvas.width/2, y: 0, width: workingCanvas.width/2, height: workingCanvas.height/2 },
        // Bottom-left quadrant
        { x: 0, y: workingCanvas.height/2, width: workingCanvas.width/2, height: workingCanvas.height/2 },
        // Bottom-right quadrant
        { x: workingCanvas.width/2, y: workingCanvas.height/2, width: workingCanvas.width/2, height: workingCanvas.height/2 },
        // Center region (larger)
        { x: workingCanvas.width/4, y: workingCanvas.height/4, width: workingCanvas.width/2, height: workingCanvas.height/2 },
      ];
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentCanvas = document.createElement('canvas');
        segmentCanvas.width = segment.width;
        segmentCanvas.height = segment.height;
        
        const ctx = segmentCanvas.getContext('2d');
        if (ctx) {
          // Draw the segment portion of the image
          ctx.drawImage(
            workingCanvas, 
            segment.x, segment.y, segment.width, segment.height,
            0, 0, segment.width, segment.height
          );
          
          // Convert to file
          const dataUrl = segmentCanvas.toDataURL("image/jpeg", 1.0);
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const segmentFile = new File([blob], `segment-${i}.jpg`, { type: "image/jpeg" });
          
          try {
            const result = await scanner.scanFileV2(segmentFile);
            if (result && result.decodedText) {
              console.log(`Successful scan with image segment ${i}`);
              return result.decodedText;
            }
          } catch (err) {
            console.log(`Failed with image segment ${i}`);
          }
        }
      }
    } catch (err) {
      console.log("Segment approach failed:", err);
    }
    
    // Last attempt: Try direct URL string detection (sometimes QR codes are just plain text)
    try {
      console.log("Final approach: Manual text pattern detection");
      const canvas = resizeImage(img, 800);
      const dataUrl = canvas.toDataURL("image/png");
      
      // Check if the image data itself contains a JSON pattern
      if (dataUrl.includes('eventId')) {
        console.log("Found potential eventId string in raw data");
        const match = dataUrl.match(/{[^}]*"eventId"[^}]*}/);
        if (match && match[0]) {
          try {
            const jsonObj = JSON.parse(match[0]);
            if (jsonObj && jsonObj.eventId) {
              console.log("Successfully extracted eventId from raw data");
              return JSON.stringify(jsonObj);
            }
          } catch (e) {
            console.log("Pattern found but not valid JSON");
          }
        }
      }
    } catch (err) {
      console.log("Text pattern detection failed:", err);
    }
    
    // If all attempts fail, throw an error
    throw new Error("Failed to detect QR code after multiple attempts");
    
  } catch (error) {
    console.error("All QR detection methods failed:", error);
    throw error;
  } finally {
    // Clean up any resources
    if (scanner && scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      await scanner.stop();
    }
  }
};
