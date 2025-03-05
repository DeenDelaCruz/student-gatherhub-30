
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';

/**
 * Checks and requests camera permissions for barcode scanning
 * @returns Promise resolving to boolean indicating if permission was granted
 */
export const checkAndRequestCameraPermission = async (): Promise<boolean> => {
  try {
    // Check if permission is already granted
    const status = await CapacitorBarcodeScanner.checkPermission({ force: false });
    
    if (status.granted) {
      return true;
    }
    
    if (status.denied || status.restricted || status.neverAsked) {
      // Request permission
      const requestResult = await CapacitorBarcodeScanner.checkPermission({ force: true });
      return requestResult.granted;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Prepares the app UI for barcode scanning (hides web content)
 */
export const prepareScanner = () => {
  if (Capacitor.isNativePlatform()) {
    // Hide the webpage content for native platforms
    CapacitorBarcodeScanner.hideBackground();
    
    // Add a class to make the body transparent
    document.body.classList.add('scanner-active');
  }
};

/**
 * Restores the app UI after barcode scanning (shows web content)
 */
export const stopScanner = () => {
  if (Capacitor.isNativePlatform()) {
    // Show the webpage content
    CapacitorBarcodeScanner.showBackground();
    
    // Remove the transparency class
    document.body.classList.remove('scanner-active');
    
    // Make sure scanner is stopped
    CapacitorBarcodeScanner.stopScan();
  }
};
