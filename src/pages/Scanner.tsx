
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const startScanner = () => {
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      
      // Simulate successful scan
      toast.success("Attendance recorded", {
        description: "You've been checked in to Comp Sci General Assembly 2025",
        position: "top-center",
        duration: 5000,
      });
    }, 3000);
  };
  
  useEffect(() => {
    // Simulate asking for camera permission
    setTimeout(() => {
      setHasPermission(true);
    }, 1000);
  }, []);
  
  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4 flex flex-col items-center justify-center">
        <motion.div 
          className="scanner-card bg-white rounded-3xl p-6 shadow-sm w-full max-w-sm text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <div className="bg-campus-accent/10 rounded-full p-4 inline-flex">
              <QrCode size={32} className="text-campus-accent" />
            </div>
            <h2 className="text-xl font-medium mt-4">Scan QR Code</h2>
            <p className="text-gray-500 text-sm mt-2">
              Scan the event QR code to mark your attendance
            </p>
          </div>
          
          {hasPermission === null ? (
            <div className="flex justify-center">
              <Loader2 size={24} className="animate-spin text-campus-accent" />
            </div>
          ) : hasPermission === false ? (
            <div className="text-red-500 text-sm">
              Camera access denied. Please enable camera permissions in your browser settings.
            </div>
          ) : (
            <>
              <div className="scanner-viewport relative mb-6 rounded-xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
                {isScanning ? (
                  <>
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-campus-purple to-campus-accent"></div>
                    <div className="scanner-line absolute top-0 left-0 right-0 h-0.5 bg-campus-accent animate-pulse-light"></div>
                  </>
                ) : (
                  <div className="text-gray-400">Camera viewfinder</div>
                )}
              </div>
              
              <button
                onClick={startScanner}
                disabled={isScanning}
                className="w-full bg-campus-accent text-white rounded-full py-3 px-4 font-medium hover:bg-campus-accent/90 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isScanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  "Start Scanning"
                )}
              </button>
            </>
          )}
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Scanner;
