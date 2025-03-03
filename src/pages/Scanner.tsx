import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2, Users, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MOCK_ATTENDEES = [
  { id: 1, name: "John Doe", email: "john@example.com", timestamp: "2025-01-15T10:30:00Z" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", timestamp: "2025-01-15T10:35:00Z" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", timestamp: "2025-01-15T10:40:00Z" },
  { id: 4, name: "Sarah Williams", email: "sarah@example.com", timestamp: "2025-01-15T10:45:00Z" },
];

const Scanner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [attendees, setAttendees] = useState(MOCK_ATTENDEES);
  const [activeTab, setActiveTab] = useState("qrcode");
  const { hasRole, user } = useAuth();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  
  const generateQRCode = () => {
    if (!eventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate QR code generation
    setTimeout(() => {
      setIsGenerating(false);
      
      // Generate a mock QR code URL with the event name encoded
      // In a real app, you would use a proper QR code generation API
      const mockQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventName)}`;
      setQrImageUrl(mockQrImageUrl);
      setQrValue(eventName);
      
      toast.success("QR Code generated", {
        description: `QR Code for "${eventName}" event is ready`,
        position: "top-center",
        duration: 5000,
      });
    }, 1500);
  };
  
  const exportAttendees = () => {
    // In a real app, generate CSV or Excel file
    toast.success("Attendance list exported", {
      description: "The attendance list has been downloaded",
    });
  };
  
  const regenerateQRCode = () => {
    setQrImageUrl("");
    setQrValue("");
  };
  
  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4 flex flex-col items-center">
        <Tabs 
          defaultValue="qrcode" 
          className="w-full max-w-md"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            {isInformationOfficer && (
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="qrcode">
            <motion.div 
              className="qrcode-card bg-white rounded-3xl p-6 shadow-sm w-full text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6">
                <div className="bg-campus-accent/10 rounded-full p-4 inline-flex">
                  <QrCode size={32} className="text-campus-accent" />
                </div>
                <h2 className="text-xl font-medium mt-4">
                  {isInformationOfficer ? "Generate QR Code" : "Scan QR Code"}
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  {isInformationOfficer 
                    ? "Create a QR code for event attendance tracking" 
                    : "Scan the event QR code to mark your attendance"}
                </p>
              </div>
              
              {isInformationOfficer ? (
                // QR code generation for information officers
                <>
                  {!qrImageUrl ? (
                    <div className="space-y-4">
                      <div className="space-y-2 text-left">
                        <Label htmlFor="eventName">Event Name</Label>
                        <Input
                          id="eventName"
                          placeholder="Enter event name"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        onClick={generateQRCode}
                        disabled={isGenerating || !eventName.trim()}
                        className="w-full bg-campus-accent text-white rounded-full py-3 px-4 font-medium hover:bg-campus-accent/90 transition-colors disabled:opacity-70 flex items-center justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          "Generate QR Code"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="qr-display bg-white p-4 rounded-xl border flex justify-center">
                        <img src={qrImageUrl} alt="QR Code" className="w-48 h-48" />
                      </div>
                      
                      <div className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg break-all">
                        {qrValue}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1"
                          onClick={regenerateQRCode}
                        >
                          <RefreshCw size={16} />
                          New QR
                        </Button>
                        
                        <Button
                          variant="outline" 
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1"
                          onClick={() => {
                            // In a real app, download the QR code
                            toast.success("QR Code downloaded", {
                              description: "QR Code image saved to your device"
                            });
                          }}
                        >
                          <Download size={16} />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Regular QR scanner for students - keeping the existing code
                <>
                  <div className="scanner-viewport relative mb-6 rounded-xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
                    <div className="text-gray-400">Camera viewfinder</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      toast.success("Attendance recorded", {
                        description: "You've been checked in to Comp Sci General Assembly 2025",
                        position: "top-center",
                        duration: 5000,
                      });
                    }}
                    className="w-full bg-campus-accent text-white rounded-full py-3 px-4 font-medium hover:bg-campus-accent/90 transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    Start Scanning
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
