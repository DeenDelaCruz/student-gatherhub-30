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
 * Try multiple approaches to process an image for QR scanning
 * This function takes an image file and tries different image processing
 * techniques to improve QR code detection chances.
 * 
 * @param file The image file to process
 * @param scanner The Html5Qrcode instance
 * @returns Promise resolving to scan result
 */
export const processImageWithMultipleApproaches = async (file: File, scanner: any): Promise<string> => {
  console.log("Attempting to process image with multiple techniques");
  
  try {
    // First try: Direct file scan
    try {
      console.log("Approach 1: Direct file scan");
      const result = await scanner.scanFileV2(file);
      if (result && result.decodedText) {
        console.log("Direct file scan successful");
        return result.decodedText;
      }
    } catch (err) {
      console.log("Direct scan failed, trying alternative methods");
    }
    
    // Second try: Create image and process with varying sizes
    const img = await createImageFromFile(file);
    console.log("Image loaded, dimensions:", img.width, "x", img.height);
    
    // Try different resolutions
    const resolutions = [1200, 800, 600, 400];
    for (const resolution of resolutions) {
      try {
        console.log(`Approach 2: Trying resolution ${resolution}px`);
        const canvas = resizeImage(img, resolution);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        
        // Create a file from the data URL
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const processedFile = new File([blob], "processed-image.jpg", { type: "image/jpeg" });
        
        const result = await scanner.scanFileV2(processedFile);
        if (result && result.decodedText) {
          console.log(`Successful scan at resolution ${resolution}px`);
          return result.decodedText;
        }
      } catch (err) {
        console.log(`Failed at resolution ${resolution}px:`, err);
      }
    }
    
    // Third try: Try with different image processing
    console.log("Approach 3: Applying image processing");
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    
    // Apply contrast enhancement
    ctx.filter = 'contrast(1.4) brightness(1.1)';
    ctx.drawImage(img, 0, 0);
    
    const enhancedDataUrl = canvas.toDataURL("image/jpeg", 1.0);
    const res = await fetch(enhancedDataUrl);
    const blob = await res.blob();
    const enhancedFile = new File([blob], "enhanced-image.jpg", { type: "image/jpeg" });
    
    try {
      const result = await scanner.scanFileV2(enhancedFile);
      if (result && result.decodedText) {
        console.log("Enhanced image scan successful");
        return result.decodedText;
      }
    } catch (err) {
      console.log("Enhanced image scan failed:", err);
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
