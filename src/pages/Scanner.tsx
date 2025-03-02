
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

// Mock data for attendees
const MOCK_ATTENDEES = [
  { id: 1, name: "John Doe", email: "john@example.com", timestamp: "2025-01-15T10:30:00Z" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", timestamp: "2025-01-15T10:35:00Z" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", timestamp: "2025-01-15T10:40:00Z" },
  { id: 4, name: "Sarah Williams", email: "sarah@example.com", timestamp: "2025-01-15T10:45:00Z" },
];

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [attendees, setAttendees] = useState(MOCK_ATTENDEES);
  const [activeTab, setActiveTab] = useState("scanner");
  const { hasRole } = useAuth();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  
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
      
      // Add the new attendee to the list
      const newAttendee = {
        id: attendees.length + 1,
        name: "New Attendee",
        email: "new@example.com",
        timestamp: new Date().toISOString()
      };
      
      setAttendees([newAttendee, ...attendees]);
    }, 3000);
  };
  
  const exportAttendees = () => {
    // In a real app, generate CSV or Excel file
    toast.success("Attendance list exported", {
      description: "The attendance list has been downloaded",
    });
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
      
      <main className="flex-1 p-4 flex flex-col items-center">
        <Tabs 
          defaultValue="scanner" 
          className="w-full max-w-md"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            {isInformationOfficer && (
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="scanner">
            <motion.div 
              className="scanner-card bg-white rounded-3xl p-6 shadow-sm w-full text-center"
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
          </TabsContent>
          
          {isInformationOfficer && (
            <TabsContent value="attendees">
              <motion.div 
                className="attendees-card bg-white rounded-3xl p-6 shadow-sm w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="text-campus-accent" />
                    <h2 className="text-xl font-medium">Attendees</h2>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportAttendees}
                    className="flex items-center gap-1"
                  >
                    <Download size={16} />
                    Export
                  </Button>
                </div>
                
                <div className="attendees-list space-y-2 max-h-96 overflow-y-auto">
                  {attendees.map((attendee) => (
                    <div 
                      key={attendee.id}
                      className="p-3 bg-gray-50 rounded-lg flex flex-col"
                    >
                      <div className="font-medium">{attendee.name}</div>
                      <div className="text-sm text-gray-500">{attendee.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(attendee.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {attendees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No attendees yet
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Scanner;
