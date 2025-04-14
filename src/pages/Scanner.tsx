import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import QrCodeGenerator from "@/components/QrCodeGenerator";
import QrScanner from "@/components/QrScanner";
import { useNavigate } from "react-router-dom";
import { 
  supabase, 
  getEventAttendees, 
  getEventInterestedUsers,
  checkInUserToEvent
} from "@/integrations/supabase/client";

const Scanner = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, hasRole, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isInfoOfficer = hasRole("information_officer") || hasRole("admin");
  const isStudent = !isInfoOfficer;
  
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to view this page");
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title, qr_code_data");
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      }
    };
    
    fetchEvents();
  }, []);

  const fetchAttendees = async (eventId: string) => {
    if (!eventId) return;
    
    setLoadingAttendees(true);
    try {
      const attendeesData = await getEventAttendees(eventId);
      
      setAttendees(attendeesData);
      
      const interestedData = await getEventInterestedUsers(eventId);
      
      setInterestedUsers(interestedData);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      toast.error("Failed to load attendees");
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    fetchAttendees(eventId);
  };

  const handleScanComplete = async (data: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      const parsedData = JSON.parse(data);
      
      if (!parsedData.eventId) {
        toast.error("Invalid QR code", {
          description: "This QR code is not for an event check-in"
        });
        return;
      }
      
      const event = events.find(e => e.id === parsedData.eventId);
      if (!event) {
        toast.error("Event not found", {
          description: "The event in this QR code doesn't exist or has been removed"
        });
        return;
      }
      
      const success = await checkInUserToEvent(parsedData.eventId, user.id);
      
      if (success) {
        toast.success("Check-in successful!", {
          description: `You have been checked in to "${event.title}"`
        });
        
        if (refreshProfile) {
          await refreshProfile();
        }
        
        if (selectedEvent === parsedData.eventId) {
          fetchAttendees(parsedData.eventId);
        }
      } else {
        toast.error("Check-in failed", {
          description: "You may have already checked in to this event"
        });
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast.error("Failed to process QR code");
    } finally {
      setIsProcessing(false);
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <Tabs defaultValue={isInfoOfficer ? "attendees" : "scanner"} className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: isInfoOfficer ? "1fr 1fr" : "1fr 1fr" }}>
            {isStudent && <TabsTrigger value="scanner">Scanner</TabsTrigger>}
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            {isInfoOfficer && <TabsTrigger value="generate">QR Code</TabsTrigger>}
          </TabsList>
          
          {isStudent && (
            <TabsContent value="scanner">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Scanner</CardTitle>
                  <CardDescription>Scan QR code to check-in to events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isScanning ? (
                    <QrScanner 
                      onScanComplete={handleScanComplete}
                      isProcessing={isProcessing}
                      onCancel={() => setIsScanning(false)}
                    />
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                        <img 
                          src="/lovable-uploads/8b012360-29f5-4cf4-958a-3e9ada2436d3.png" 
                          alt="QR Code Icon" 
                          className="w-16 h-16"
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold">Scan Event QR Code</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          Scan the event QR code to mark your attendance
                        </p>
                      </div>
                      
                      <Button onClick={() => setIsScanning(true)} className="w-full">
                        Scan QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {user && (
                    <p className="text-sm text-gray-500">
                      Logged in as: {user.email}
                    </p>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <CardTitle>Event Attendees</CardTitle>
                <CardDescription>View attendees for a specific event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="eventId">Select Event</Label>
                  <Select onValueChange={handleEventSelect}>
                    <SelectTrigger id="eventId">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {loadingAttendees ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-md font-semibold">Attendees</h3>
                      {attendees.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {attendees.map((attendee: any) => (
                            <li key={attendee.id}>{attendee.name} ({attendee.email})</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No attendees yet.</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold">Interested Users</h3>
                      {interestedUsers.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {interestedUsers.map((user: any) => (
                            <li key={user.id}>{user.name} ({user.email})</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No interested users yet.</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {isInfoOfficer && (
            <TabsContent value="generate">
              {user && <QrCodeGenerator userId={user.id} />}
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Scanner;
