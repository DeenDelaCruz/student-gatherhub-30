
/**
 * This file is being kept for backward compatibility.
 * We've transitioned away from using Capacitor for QR scanning.
 */

import { Capacitor } from '@capacitor/core';

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
