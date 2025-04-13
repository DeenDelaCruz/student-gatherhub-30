import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import QrScanner from "@/components/QrScanner";
import QrCodeGenerator from "@/components/QrCodeGenerator";
import { useNavigate } from "react-router-dom";
import { 
  supabase, 
  checkInUserToEvent, 
  getEventAttendees, 
  getEventInterestedUsers 
} from "@/integrations/supabase/client";

const Scanner = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const isInfoOfficer = hasRole("information_officer") || hasRole("admin");
  
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to use the scanner");
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title");
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      }
    };
    
    fetchEvents();
  }, []);

  const handleScanData = async (data: string) => {
    try {
      setProcessing(true);
      
      let eventId: string;
      try {
        const jsonData = JSON.parse(data);
        eventId = jsonData.eventId || jsonData.event_id || jsonData.id;
        
        if (!eventId) {
          toast.error("Invalid QR code format");
          return;
        }
      } catch (e) {
        eventId = data;
      }
      
      console.log(`Attempting to check in user ${user?.id} to event ${eventId}`);
      
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
        
      if (eventError || !eventData) {
        toast.error("Event not found");
        console.error("Event not found error:", eventError);
        return;
      }
      
      const attendees = await getEventAttendees(eventId);
      
      const isAlreadyCheckedIn = attendees.some((attendee: any) => 
        attendee.id === user?.id
      );
      
      if (isAlreadyCheckedIn) {
        toast.info("You are already checked in to this event");
        return;
      }
      
      const success = await checkInUserToEvent(eventId, user?.id as string);
      
      if (success) {
        toast.success(`Checked in to: ${eventData.title}`);
        fetchAttendees(selectedEvent);
      } else {
        toast.error("Failed to check in");
      }
    } catch (error) {
      console.error("Error processing scan:", error);
      toast.error("Error processing scan");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelScan = () => {
    setScanResult(null);
  };

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

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <Tabs defaultValue="scanner" className="w-full max-w-2xl mx-auto">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            {isInfoOfficer && <TabsTrigger value="generate">QR Code</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>Scan QR code to check-in users to events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanResult ? (
                  <div className="text-green-500 font-bold">
                    Scan Successful: {scanResult}
                    <Button onClick={handleCancelScan} className="ml-2">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <QrScanner 
                    onScanComplete={handleScanData}
                    isProcessing={processing}
                    onCancel={handleCancelScan}
                  />
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
