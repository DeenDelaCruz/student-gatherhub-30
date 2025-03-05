
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.852756b716e34317aa137cc632483a45',
  appName: 'student-gatherhub-96',
  webDir: 'dist',
  server: {
    url: 'https://852756b7-16e3-4317-aa13-7cc632483a45.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Permissions for Camera and BarcodeScanner
    PermissionType: {
      Camera: {
        alias: "camera",
        permission: "android.permission.CAMERA"
      }
    }
  }
};

export default config;
