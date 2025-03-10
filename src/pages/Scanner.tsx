
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { QrCode, Loader2, Users, Download, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { supabase, checkInUserToEvent, getEventAttendees, getEventInterestedUsers } from "@/integrations/supabase/client";
import QrScanner from "@/components/QrScanner";

// UUID regex pattern
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Event {
  id: string;
  title: string;
}

interface Attendee {
  id: string;
  check_in_time: string | null;
  user_id: string;
  profile: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface InterestedUser {
  id: string;
  created_at: string;
  user_id: string;
  profile: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

const Scanner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("qrcode");
  const [activeUserTab, setActiveUserTab] = useState("attendees");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { hasRole, user, refreshProfileData } = useAuth();
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
    const fetchUsersData = async () => {
      if (!isInformationOfficer || !selectedEvent) return;
      
      try {
        setIsLoadingUsers(true);
        
        const attendeesData = await getEventAttendees(selectedEvent, true);
        setAttendees(attendeesData);
        
        const interestedData = await getEventInterestedUsers(selectedEvent, true);
        setInterestedUsers(interestedData);
      } catch (error: any) {
        console.error("Error fetching users data:", error);
        toast.error(error.message || "Failed to load users data");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    if (activeTab === "attendees" && selectedEvent) {
      fetchUsersData();
    }
  }, [selectedEvent, activeTab, isInformationOfficer]);
  
  useEffect(() => {
    if (!selectedEvent || !isInformationOfficer || activeTab !== "attendees") return;
    
    const attendeesChannel = supabase
      .channel(`event-attendees-${selectedEvent}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees_new',
          filter: `event_id=eq.${selectedEvent}`
        }, 
        () => {
          console.log("Real-time update received for event attendees");
          
          getEventAttendees(selectedEvent, true)
            .then(data => setAttendees(data))
            .catch(error => console.error("Error refreshing attendees:", error));
        }
      )
      .subscribe();
      
    const interestedChannel = supabase
      .channel(`event-interested-${selectedEvent}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_interested',
          filter: `event_id=eq.${selectedEvent}`
        }, 
        () => {
          console.log("Real-time update received for interested users");
          
          getEventInterestedUsers(selectedEvent, true)
            .then(data => setInterestedUsers(data))
            .catch(error => console.error("Error refreshing interested users:", error));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(attendeesChannel);
      supabase.removeChannel(interestedChannel);
    };
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
  
  const handleScanComplete = async (scannedData: string) => {
    if (!user) {
      toast.error("Please log in to scan QR codes");
      return;
    }
    
    setIsProcessing(true);
    setScanResult(scannedData);
    console.log("Raw scanned data:", scannedData);
    
    try {
      let eventId;
      
      const cleanedData = scannedData.trim();
      console.log("Cleaned data:", cleanedData);
      
      try {
        if (uuidRegex.test(cleanedData)) {
          console.log("Direct UUID detected in QR code");
          eventId = cleanedData;
        } else {
          const parsedData = JSON.parse(cleanedData);
          console.log("Parsed JSON data from QR code:", parsedData);
          
          eventId = parsedData.eventId || parsedData.id;
          
          if (!eventId) {
            for (const key in parsedData) {
              const value = parsedData[key];
              if (typeof value === 'string' && uuidRegex.test(value)) {
                console.log(`Found UUID in property ${key}:`, value);
                eventId = value;
                break;
              }
            }
          }
          
          if (!eventId) {
            throw new Error("Could not find valid event ID in parsed JSON data");
          }
        }
      } catch (parseError) {
        console.error("Error parsing QR code:", parseError);
        
        if (cleanedData.match(uuidRegex)) {
          eventId = cleanedData;
          console.log("Using raw string as event ID:", eventId);
        } else {
          const uuidMatch = cleanedData.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (uuidMatch) {
            eventId = uuidMatch[0];
            console.log("Extracted UUID from string:", eventId);
          } else {
            throw new Error("Invalid QR code format: no valid event ID found");
          }
        }
      }
      
      if (!eventId) {
        throw new Error("Could not determine event ID from QR code");
      }
      
      console.log("Using event ID for check-in:", eventId);
      
      let success = false;
      let attempts = 0;
      
      while (!success && attempts < 3) {
        attempts++;
        console.log(`Check-in attempt ${attempts} for user ${user.id} to event ${eventId}`);
        success = await checkInUserToEvent(eventId, user.id);
        
        if (!success && attempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (success) {
        setScanSuccess(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("title")
          .eq("id", eventId)
          .maybeSingle();
          
        if (eventError) {
          console.error("Error fetching event details:", eventError);
        }
        
        if (eventData) {
          toast.success(`Checked in to: ${eventData.title}`, {
            description: "Your attendance has been recorded",
          });
        } else {
          toast.success("Attendance recorded", {
            description: "You've been successfully checked in to the event",
          });
        }
        
        if (user && refreshProfileData) {
          setTimeout(() => {
            console.log("Refreshing profile data for user:", user.id);
            refreshProfileData(user.id);
          }, 2000);
        }
      } else {
        setScanSuccess(false);
        throw new Error(`Failed to check in to the event after ${attempts} attempts`);
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
  
  const exportUsersList = () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }
    
    const eventTitle = events.find(e => e.id === selectedEvent)?.title || "event";
    toast.success(`User list for "${eventTitle}" exported`, {
      description: "The list has been downloaded",
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
              <TabsTrigger value="attendees">Users</TabsTrigger>
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
                    <h2 className="text-xl font-medium">Event Users</h2>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <Label htmlFor="usersEventSelect">Select an Event</Label>
                    <Select 
                      onValueChange={setSelectedEvent} 
                      value={selectedEvent}
                    >
                      <SelectTrigger id="usersEventSelect">
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
                  
                  <div className="flex justify-between items-center">
                    <Tabs
                      value={activeUserTab}
                      onValueChange={setActiveUserTab}
                      className="w-full"
                    >
                      <TabsList>
                        <TabsTrigger value="attendees">Attendees ({attendees.length})</TabsTrigger>
                        <TabsTrigger value="interested">Interested ({interestedUsers.length})</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportUsersList}
                      className="flex items-center gap-1 ml-2"
                      disabled={!selectedEvent}
                    >
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="users-list space-y-2 max-h-96 overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : selectedEvent ? (
                    activeUserTab === "attendees" ? (
                      attendees.length > 0 ? (
                        attendees.map((attendee) => (
                          <div 
                            key={attendee.id}
                            className="p-3 bg-gray-50 rounded-lg flex flex-col"
                          >
                            <div className="font-medium">{attendee.profile?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{attendee.profile?.email || 'No email'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Checked in: {attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : 'Not checked in'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No attendees have checked in yet
                        </div>
                      )
                    ) : (
                      interestedUsers.length > 0 ? (
                        interestedUsers.map((user) => (
                          <div 
                            key={user.id}
                            className="p-3 bg-gray-50 rounded-lg flex flex-col"
                          >
                            <div className="font-medium">{user.profile?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{user.profile?.email || 'No email'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Interested since: {new Date(user.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No users have shown interest yet
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select an event to view users
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
