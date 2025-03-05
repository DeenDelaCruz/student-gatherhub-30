
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2, Users, Download, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";

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
    // Fetch active events for the information officer
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
    // Fetch attendees for the selected event
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
    
    // Create a QR code with the event ID encoded
    const eventInfo = JSON.stringify({ eventId: selectedEvent });
    
    // Simulate QR code generation
    setTimeout(() => {
      setIsGenerating(false);
      
      // In a real app, use a proper QR code generation API
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
    // In a real app, this would activate the camera and scan a QR code
    // Here we'll simulate scanning the generated QR code
    
    if (!user) {
      toast.error("Please log in to scan QR codes");
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate scanning process
    setTimeout(async () => {
      try {
        // Simulate a successful scan with the last generated QR code
        // In a real app, this would come from the QR scanner
        const scannedData = qrValue || JSON.stringify({ eventId: events[0]?.id });
        setScanResult(scannedData);
        
        // Parse the scanned data
        const { eventId } = JSON.parse(scannedData);
        
        // Check if user has already checked in for this event
        const { data: existingCheckIn, error: checkError } = await supabase
          .from("event_attendees")
          .select("id, check_in_time")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        if (existingCheckIn && existingCheckIn.check_in_time) {
          // User already checked in
          toast.info("You've already checked in to this event");
        } else if (existingCheckIn) {
          // User was interested but hadn't checked in yet
          const { error: updateError } = await supabase
            .from("event_attendees")
            .update({ check_in_time: new Date().toISOString() })
            .eq("id", existingCheckIn.id);
            
          if (updateError) throw updateError;
          
          setScanSuccess(true);
          toast.success("Attendance recorded", {
            description: "You've been successfully checked in to the event",
          });
        } else {
          // User wasn't interested, create new record with check-in
          const { error: insertError } = await supabase
            .from("event_attendees")
            .insert({
              event_id: eventId,
              user_id: user.id,
              check_in_time: new Date().toISOString()
            });
            
          if (insertError) throw insertError;
          
          setScanSuccess(true);
          toast.success("Attendance recorded", {
            description: "You've been successfully checked in to the event",
          });
        }
        
        // Get event details to show confirmation
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("title")
          .eq("id", eventId)
          .single();
          
        if (eventError) throw eventError;
        
        if (eventData) {
          toast.success(`Checked in to: ${eventData.title}`);
        }
        
      } catch (error: any) {
        console.error("Error processing QR code:", error);
        setScanSuccess(false);
        toast.error(error.message || "Failed to process QR code");
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
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
    
    // In a real app, generate CSV or Excel file
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
                // QR code generation for information officers
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
                // QR scanner for students
                <>
                  {!scanResult ? (
                    <>
                      <div className="scanner-viewport relative mb-6 rounded-xl overflow-hidden bg-black/5 aspect-square flex items-center justify-center">
                        {isProcessing ? (
                          <div className="text-gray-500 flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Processing...</p>
                          </div>
                        ) : (
                          <div className="text-gray-400">Camera viewfinder</div>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleScanQR}
                        disabled={isProcessing}
                        className="w-full bg-campus-accent text-white rounded-full py-3 px-4 font-medium hover:bg-campus-accent/90 transition-colors disabled:opacity-70 flex items-center justify-center"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Start Scanning"
                        )}
                      </Button>
                    </>
                  ) : (
                    // Show scan result
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
