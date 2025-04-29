
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
 * Validates if a string is a valid QR code format for event check-in
 * @param data The decoded QR code data string
 * @returns Boolean indicating if the data is valid
 */
export const validateQrCodeData = (data: string): boolean => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(data);
    
    // Check if it has the expected event check-in format
    return typeof parsed === 'object' && 
           parsed !== null && 
           typeof parsed.eventId === 'string' && 
           parsed.eventId.length > 0;
  } catch (error) {
    console.error('QR code validation error:', error);
    return false;
  }
};

