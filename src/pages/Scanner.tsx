
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
import { useNavigate } from "react-router-dom";
import { 
  supabase, 
  getEventAttendees, 
  getEventInterestedUsers 
} from "@/integrations/supabase/client";

const Scanner = () => {
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

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <Tabs defaultValue={isInfoOfficer ? "attendees" : "scanner"} className="w-full max-w-2xl mx-auto">
          <TabsList className={`grid ${isInfoOfficer ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {!isInfoOfficer && <TabsTrigger value="scanner">Scanner</TabsTrigger>}
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            {isInfoOfficer && <TabsTrigger value="generate">QR Code</TabsTrigger>}
          </TabsList>
          
          {!isInfoOfficer && (
            <TabsContent value="scanner">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Scanner</CardTitle>
                  <CardDescription>Scan QR code to check-in to events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p>Please navigate to the event page to scan the QR code for check-in.</p>
                    <Button onClick={() => navigate("/")} className="mt-4">
                      Browse Events
                    </Button>
                  </div>
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
