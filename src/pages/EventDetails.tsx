
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, getEventInterestCount, isUserInterestedInEvent, markEventInterest, removeEventInterest } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { Event, convertSupabaseEventToEvent } from "@/types/event";
import { CalendarClock, MapPin, Users, Heart, AlertTriangle, Edit, ToggleLeft, ToggleRight, Bell } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { format } from "date-fns";
import { Notification } from "@/types/notification";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState<number | null>(null);
  const [eventUpdates, setEventUpdates] = useState<Notification[]>([]);
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  const canEdit = isInformationOfficer && event?.created_by === user?.id;

  const fetchInterestCount = async () => {
    if (!eventId) return;
    const count = await getEventInterestCount(eventId);
    setInterestedCount(count);
  };

  const fetchUserInterest = async () => {
    if (!eventId || !user) return;
    const interested = await isUserInterestedInEvent(eventId, user.id);
    setIsInterested(interested);
  };

  const fetchEventUpdates = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("related_id", eventId)
        .eq("type", "event")
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setEventUpdates(data);
      }
    } catch (error) {
      console.error("Error fetching event updates:", error);
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        
        if (eventData) {
          setEvent(convertSupabaseEventToEvent(eventData));
        }
        
        await fetchInterestCount();
        await fetchEventUpdates();
        if (user) {
          await fetchUserInterest();
        }
        
      } catch (error: any) {
        console.error("Error fetching event details:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUpdating) {
      fetchEventDetails();
    }
  }, [eventId, user, isUpdating]);

  useEffect(() => {
    if (!eventId || isLoading || isUpdating) return;

    const channelName = `event-interest-${eventId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_interested',
          filter: `event_id=eq.${eventId}` 
        }, 
        async () => {
          if (lastToggleTime && Date.now() - lastToggleTime < 2000) {
            console.log("Skipping real-time update due to recent toggle");
            return;
          }
          
          if (!isUpdating) {
            await fetchInterestCount();
            if (user) {
              await fetchUserInterest();
            }
          }
        }
      )
      .subscribe();

    console.log(`Subscribed to channel: ${channelName}`);
    
    return () => {
      console.log(`Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [eventId, isLoading, isUpdating, user, lastToggleTime]);

  // Subscribe to notifications table changes for this event
  useEffect(() => {
    if (!eventId) return;
    
    const channelName = `event-updates-${eventId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `related_id=eq.${eventId}` 
        }, 
        async () => {
          await fetchEventUpdates();
        }
      )
      .subscribe();

    console.log(`Subscribed to notifications channel: ${channelName}`);
    
    return () => {
      console.log(`Unsubscribing from notifications channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleToggleInterest = async () => {
    if (!user) {
      toast.error("Please log in to mark your interest");
      navigate("/auth");
      return;
    }

    if (isUpdating || !eventId) return;

    if (event && !event.is_active) {
      toast.error("This event is no longer active");
      return;
    }

    try {
      setIsUpdating(true);
      
      const newInterestedState = !isInterested;
      setIsInterested(newInterestedState);
      
      setInterestedCount(prevCount => newInterestedState ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      setLastToggleTime(Date.now());

      if (newInterestedState) {
        await markEventInterest(eventId, user.id);
        
        if (event) {
          const eventDate = new Date(event.event_date);
          const now = new Date();
          const oneDayBefore = new Date(eventDate);
          oneDayBefore.setDate(oneDayBefore.getDate() - 1);
          
          if (eventDate > now && oneDayBefore > now) {
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: user.id,
                title: "Event Reminder",
                message: `You've marked interest in ${event.title}. We'll remind you before the event!`,
                type: "info",
                related_id: eventId.toString(),
                read: false
              });
            
            if (notifError) {
              console.error("Error creating notification:", notifError);
            }
          }
        }
        
        toast.success("You are now interested in this event");
      } else {
        await removeEventInterest(eventId, user.id);
        toast.success("You are no longer interested in this event");
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchUserInterest();
      await fetchInterestCount();
      
    } catch (error: any) {
      console.error("Error updating interest:", error);
      toast.error(error.message || "Failed to update interest");
      
      setIsInterested(!isInterested);
      setInterestedCount(prevCount => isInterested ? prevCount - 1 : prevCount + 1);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (!eventId || !canEdit) return;
    navigate(`/edit-event/${eventId}`);
  };

  const handleToggleActive = async () => {
    if (!eventId || !canEdit) {
      toast.error("You can only change status of events you created");
      return;
    }

    if (isUpdating || !event) return;
    
    try {
      setIsUpdating(true);
      const newStatus = !event.is_active;
      
      const { error } = await supabase
        .from("events")
        .update({ is_active: newStatus })
        .eq("id", eventId.toString());
        
      if (error) throw error;
      
      setEvent({...event, is_active: newStatus});
      toast.success(`Event ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error("Error toggling event status:", error);
      toast.error(error.message || "Failed to update event status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
        <Header />
        <main className="flex-1 p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
        </main>
        <Navigation />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
        <Header />
        <main className="flex-1 p-4">
          <div className="text-center py-12">
            <h2 className="text-xl font-medium">Event not found</h2>
            <Button onClick={handleBack} className="mt-4">Go Back</Button>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4 hover:bg-gray-100"
        >
          ← Back
        </Button>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="relative h-48 w-full overflow-hidden">
            <img 
              src={event?.image_url || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"} 
              alt={event?.title} 
              className="w-full h-full object-cover"
            />
            {event && !event.is_active && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-medium">
                INACTIVE
              </div>
            )}
          </div>
          
          <div className="p-4">
            {eventUpdates.length > 0 && (
              <div className="mb-4 space-y-2">
                {eventUpdates.map((update) => (
                  <div 
                    key={update.id} 
                    className="bg-gray-100 p-3 rounded-lg flex items-start gap-2"
                  >
                    <Bell className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{update.title}</p>
                      <p className="text-sm text-gray-600">{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold">{event?.title}</h1>
              
              {canEdit && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEdit}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleToggleActive}
                    className="flex items-center gap-1"
                    disabled={isUpdating}
                  >
                    {event?.is_active ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        Inactive
                      </>
                    )}
                    {isUpdating && <span className="ml-1 animate-spin">•</span>}
                  </Button>
                </div>
              )}
            </div>
            
            {event && !event.is_active && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>This event is no longer active and registration is closed.</p>
              </div>
            )}
            
            <div className="flex items-center mb-2 text-gray-600">
              <CalendarClock className="h-4 w-4 mr-2" />
              <span>{event?.event_date ? format(new Date(event.event_date), 'MMMM d, yyyy - h:mm a') : ''}</span>
            </div>
            
            {event?.location && (
              <div className="flex items-center mb-2 text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center mb-4 text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>{interestedCount} interested</span>
            </div>
            
            <div className="mb-6 mt-4">
              <h2 className="font-medium mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{event?.description || "No description available."}</p>
            </div>
            
            <Button 
              onClick={handleToggleInterest}
              className={isInterested ? "bg-red-500 hover:bg-red-600" : ""}
              disabled={isUpdating || (event && !event.is_active)}
            >
              <Heart className={`h-4 w-4 mr-2 ${isInterested ? "fill-white" : ""}`} />
              {isInterested ? "Interested" : "Mark Interested"}
              {isUpdating && <span className="ml-2 animate-spin">•</span>}
            </Button>
          </div>
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default EventDetails;
