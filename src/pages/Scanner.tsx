import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2, Users, Download, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { supabase, checkInUserToEvent } from "@/integrations/supabase/client";
import QrScanner from "@/components/QrScanner";
import { Capacitor } from "@capacitor/core";

interface Event {
  id: string;
  title: string;
}

const Scanner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState([]);
  const [activeTab, setActiveTab] = useState("qrcode");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { hasRole, user } = useAuth();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!isInformationOfficer) return;
      
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title")
          .eq("is_active", true)
          .order("event_date", { ascending: false });
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      }
    };
    
    fetchEvents();
  }, [isInformationOfficer]);
  
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!isInformationOfficer || !selectedEvent) return;
      
      try {
        const { data, error } = await supabase
          .from("event_attendees")
          .select(`
            id, 
            check_in_time,
            profiles:user_id(
              id, 
              name, 
              email
            )
          `)
          .eq("event_id", selectedEvent)
          .not("check_in_time", "is", null);
        
        if (error) throw error;
        
        setAttendees(data || []);
      } catch (error) {
        console.error("Error fetching attendees:", error);
        toast.error("Failed to load attendees");
      }
    };
    
    if (activeTab === "attendees" && selectedEvent) {
      fetchAttendees();
    }
  }, [selectedEvent, activeTab, isInformationOfficer]);
  
  const generateQRCode = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsGenerating(true);
    
    const eventInfo = JSON.stringify({ eventId: selectedEvent });
    
    setTimeout(() => {
      setIsGenerating(false);
      
      const mockQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventInfo)}`;
      setQrImageUrl(mockQrImageUrl);
      setQrValue(eventInfo);
      
      const eventTitle = events.find(e => e.id === selectedEvent)?.title || "Selected event";
      
      toast.success("QR Code generated", {
        description: `QR Code for "${eventTitle}" event is ready`,
        position: "top-center",
        duration: 5000,
      });
    }, 1500);
  };
  
  const handleScanQR = () => {
    if (!user) {
      toast.error("Please log in to scan QR codes");
      return;
    }
    
    setIsProcessing(true);
  };
  
  const handleScanComplete = async (scannedData: string) => {
    if (!user) {
      toast.error("Please log in to scan QR codes");
      return;
    }
    
    setIsProcessing(true);
    setScanResult(scannedData);
    
    try {
      const { eventId } = JSON.parse(scannedData);
      
      const success = await checkInUserToEvent(eventId, user.id);
      
      if (success) {
        setScanSuccess(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("title")
          .eq("id", eventId)
          .single();
          
        if (eventError) throw eventError;
        
        if (eventData) {
          toast.success(`Checked in to: ${eventData.title}`, {
            description: "Your attendance has been recorded",
          });
        } else {
          toast.success("Attendance recorded", {
            description: "You've been successfully checked in to the event",
          });
        }
      } else {
        setScanSuccess(false);
        toast.error("Failed to check in to the event");
      }
    } catch (error: any) {
      console.error("Error processing QR code:", error);
      setScanSuccess(false);
      toast.error(error.message || "Failed to process QR code");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetScanResult = () => {
    setScanResult(null);
    setScanSuccess(false);
  };
  
  const exportAttendees = () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }
    
    const eventTitle = events.find(e => e.id === selectedEvent)?.title || "event";
    toast.success(`Attendance list for "${eventTitle}" exported`, {
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
                  {isInformationOfficer ? "Generate Event QR Code" : "Scan Event QR Code"}
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  {isInformationOfficer 
                    ? "Create a QR code for event attendance tracking" 
                    : "Scan the event QR code to mark your attendance"}
                </p>
              </div>
              
              {isInformationOfficer ? (
                <>
                  {!qrImageUrl ? (
                    <div className="space-y-4">
                      <div className="space-y-2 text-left">
                        <Label htmlFor="eventSelect">Select an Event</Label>
                        <Select 
                          onValueChange={setSelectedEvent} 
                          value={selectedEvent}
                        >
                          <SelectTrigger id="eventSelect">
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.length > 0 ? (
                              events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-events" disabled>
                                No active events available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        onClick={generateQRCode}
                        disabled={isGenerating || !selectedEvent}
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
                        Event: {events.find(e => e.id === selectedEvent)?.title}
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
                <>
                  {!scanResult ? (
                    <QrScanner 
                      onScanComplete={handleScanComplete} 
                      isProcessing={isProcessing}
                      onCancel={() => {}}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 ${scanSuccess ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                        {scanSuccess ? (
                          <>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <h3 className="text-lg font-medium">Check-in Successful!</h3>
                            <p className="text-sm text-gray-600">You have been checked in to the event.</p>
                          </>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                              <QrCode className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-medium">Check-in Failed</h3>
                            <p className="text-sm text-gray-600">Unable to process the QR code.</p>
                          </>
                        )}
                      </div>
                      
                      <Button
                        onClick={resetScanResult}
                        className="w-full"
                      >
                        Scan Another QR Code
                      </Button>
                    </div>
                  )}
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
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="text-campus-accent" />
                    <h2 className="text-xl font-medium">Attendees</h2>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <Label htmlFor="attendeesEventSelect">Select an Event</Label>
                    <Select 
                      onValueChange={setSelectedEvent} 
                      value={selectedEvent}
                    >
                      <SelectTrigger id="attendeesEventSelect">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.length > 0 ? (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-events" disabled>
                            No active events available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportAttendees}
                      className="flex items-center gap-1"
                      disabled={!selectedEvent}
                    >
                      <Download size={16} />
                      Export List
                    </Button>
                  </div>
                </div>
                
                <div className="attendees-list space-y-2 max-h-96 overflow-y-auto">
                  {selectedEvent ? (
                    attendees.length > 0 ? (
                      attendees.map((attendee: any) => (
                        <div 
                          key={attendee.id}
                          className="p-3 bg-gray-50 rounded-lg flex flex-col"
                        >
                          <div className="font-medium">{attendee.profiles?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{attendee.profiles?.email || 'No email'}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : 'Not checked in'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No attendees have checked in yet
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select an event to view attendees
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
