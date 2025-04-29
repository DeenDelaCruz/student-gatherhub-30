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
import { Download, Users } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  supabase, 
  getEventAttendees, 
  getEventInterestedUsers,
  checkInUserToEvent
} from "@/integrations/supabase/client";
import { exportUsersToExcel } from "@/utils/exportUtils";

const Scanner = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUsersTab, setActiveUsersTab] = useState("attendees");
  const [attendeesWithRatings, setAttendeesWithRatings] = useState<any[]>([]);
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

  const fetchAttendeesWithRatings = async (eventId: string) => {
    if (!eventId) return;
    
    setLoadingAttendees(true);
    try {
      const attendeesData = await getEventAttendees(eventId);
      
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('event_ratings')
        .select('rating, feedback, user_id')
        .eq('event_id', eventId);
        
      if (ratingsError) throw ratingsError;
      
      const combinedData = attendeesData.map(attendee => ({
        ...attendee,
        rating: ratingsData?.find(r => r.user_id === attendee.user_id)?.rating || null,
        feedback: ratingsData?.find(r => r.user_id === attendee.user_id)?.feedback || null
      }));
      
      setAttendeesWithRatings(combinedData);
      setAttendees(combinedData);
      
      const interestedData = await getEventInterestedUsers(eventId);
      
      const processedInterestedUsers = interestedData.map(user => ({
        id: user.id,
        user_id: user.user_id,
        name: user.profiles?.name || 'N/A',
        email: user.profiles?.email || 'N/A'
      }));
      
      setInterestedUsers(processedInterestedUsers);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      toast.error("Failed to load attendees");
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    const event = events.find(e => e.id === eventId);
    setSelectedEventTitle(event?.title || "");
    fetchAttendeesWithRatings(eventId);
  };

  const handleScanComplete = async (data: string) => {
    if (!user) {
      toast.error("You need to be logged in to check in");
      return;
    }
    
    try {
      setIsProcessing(true);
      console.log("Processing scan data:", data);
      
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        console.error("Error parsing QR data:", error);
        toast.error("Invalid QR code format", {
          description: "The QR code could not be processed"
        });
        return;
      }
      
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
      
      console.log("Checking in to event:", parsedData.eventId, "User:", user.id);
      const success = await checkInUserToEvent(parsedData.eventId, user.id);
      
      if (success) {
        toast.success("Check-in successful!", {
          description: `You have been checked in to "${event.title}"`
        });
        
        if (refreshProfile) {
          await refreshProfile();
        }
        
        if (selectedEvent === parsedData.eventId) {
          fetchAttendeesWithRatings(parsedData.eventId);
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

  const handleExportUsers = () => {
    if (!selectedEvent || !selectedEventTitle) {
      toast.error("Please select an event first");
      return;
    }

    const exportAttendees = attendees.map(attendee => ({
      event: selectedEventTitle,
      name: attendee.profiles?.name || 'N/A',
      email: attendee.profiles?.email || 'N/A',
      check_in_time: attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : null,
      status: "Attended",
      rating: attendee.rating || 'No rating',
      feedback: attendee.feedback || 'No feedback'
    }));

    const exportInterested = interestedUsers.map(user => ({
      event: selectedEventTitle,
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      check_in_time: null,
      status: "Interested",
      rating: null,
      feedback: null
    }));

    const allUsers = [...exportAttendees, ...exportInterested];

    exportUsersToExcel(selectedEventTitle, allUsers);
    toast.success("User data exported successfully");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 pb-20">
        <Tabs defaultValue={isInfoOfficer ? "attendees" : "scanner"} className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: isInfoOfficer ? "1fr 1fr" : "1fr 1fr" }}>
            {isStudent && <TabsTrigger value="scanner">Scanner</TabsTrigger>}
            <TabsTrigger value="attendees">Users</TabsTrigger>
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
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Event Users
                  </CardTitle>
                  <CardDescription>View and export event attendees and interested users</CardDescription>
                </div>
                {selectedEvent && isInfoOfficer && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportUsers}
                    className="ml-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
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
                
                {selectedEvent && (
                  <div className="space-y-4">
                    <Tabs 
                      value={activeUsersTab} 
                      onValueChange={setActiveUsersTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="attendees">
                          Attendees ({attendees.length})
                        </TabsTrigger>
                        <TabsTrigger value="interested">
                          Interested ({interestedUsers.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="attendees" className="pt-4">
                        {loadingAttendees ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                          </div>
                        ) : attendees.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/5">Name</TableHead>
                                  <TableHead className="w-1/5">Email</TableHead>
                                  <TableHead className="w-1/5">Check-in Time</TableHead>
                                  {(isInfoOfficer || hasRole("admin")) && (
                                    <>
                                      <TableHead className="w-1/10">Rating</TableHead>
                                      <TableHead className="w-3/10">Feedback</TableHead>
                                    </>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {attendees.map((attendee) => (
                                  <TableRow key={attendee.id}>
                                    <TableCell className="font-medium max-w-[200px] break-words">
                                      {attendee.profiles?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] break-words">
                                      {attendee.profiles?.email || 'N/A'}
                                    </TableCell>
                                    <TableCell>{formatDate(attendee.check_in_time)}</TableCell>
                                    {(isInfoOfficer || hasRole("admin")) && (
                                      <>
                                        <TableCell>
                                          {attendee.rating ? `${attendee.rating}/5` : 'No rating'}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                          <div className="whitespace-normal break-words">
                                            {attendee.feedback || 'No feedback'}
                                          </div>
                                        </TableCell>
                                      </>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">
                            No attendees for this event yet.
                          </p>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="interested" className="pt-4">
                        {loadingAttendees ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                          </div>
                        ) : interestedUsers.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/2">Name</TableHead>
                                  <TableHead className="w-1/2">Email</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {interestedUsers.map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell className="font-medium max-w-[300px] break-words">
                                      {user.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] break-words">
                                      {user.email || 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">
                            No interested users for this event yet.
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
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
