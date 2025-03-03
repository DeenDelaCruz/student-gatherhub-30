
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, getEventInterestCount, isUserInterestedInEvent } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { Event, convertSupabaseEventToEvent } from "@/types/event";
import { CalendarClock, MapPin, Users, Heart } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { format } from "date-fns";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [lastToggleTime, setLastToggleTime] = useState<number | null>(null);

  // Function to fetch interest count
  const fetchInterestCount = async () => {
    if (!eventId) return;
    const count = await getEventInterestCount(eventId);
    setInterestedCount(count);
  };

  // Function to fetch user interest state
  const fetchUserInterest = async () => {
    if (!eventId || !user) return;
    const interested = await isUserInterestedInEvent(eventId, user.id);
    setIsInterested(interested);
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        
        if (eventData) {
          setEvent(convertSupabaseEventToEvent(eventData));
        }
        
        // Get interest count and user interest status
        await fetchInterestCount();
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

    // Only fetch if not currently updating
    if (!isUpdating) {
      fetchEventDetails();
    }

    // Clean up previous subscription if it exists
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [eventId, user, isUpdating]);

  // Setup real-time subscription in a separate effect
  useEffect(() => {
    // Don't setup subscription if loading or updating
    if (!eventId || isLoading || isUpdating) return;

    // Set up real-time subscription for interest updates with a more specific channel name
    const channelName = `event-interest-${eventId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees',
          filter: `event_id=eq.${eventId}` 
        }, 
        async (payload) => {
          console.log("Realtime update received:", payload);
          
          // Skip real-time updates during manual toggle operation
          // or if the toggle was very recent (less than 2 seconds ago)
          const now = Date.now();
          if (isUpdating || (lastToggleTime && now - lastToggleTime < 2000)) {
            console.log("Skipping real-time update due to recent toggle");
            return;
          }
          
          // Update count and interest state from the database
          await fetchInterestCount();
          
          // Only update user's own interest state if they're logged in
          if (user) {
            await fetchUserInterest();
          }
        }
      )
      .subscribe();

    console.log(`Subscribed to channel: ${channelName}`);
    setSubscription(channel);

    return () => {
      // Clean up subscription
      console.log(`Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
      setSubscription(null);
    };
  }, [eventId, isLoading, isUpdating, user, lastToggleTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [subscription]);

  const handleToggleInterest = async () => {
    if (!user) {
      toast.error("Please log in to mark your interest");
      navigate("/auth");
      return;
    }

    if (isUpdating || !eventId) return; // Prevent multiple simultaneous updates

    try {
      setIsUpdating(true); // Prevent realtime updates while we're toggling
      
      // Update local state immediately for better UX
      const newInterestedState = !isInterested;
      setIsInterested(newInterestedState);
      setInterestedCount(prevCount => newInterestedState ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // Record the time of this toggle
      setLastToggleTime(Date.now());

      if (newInterestedState === false) {
        // Remove interest
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId.toString())
          .eq("user_id", user.id)
          .is("check_in_time", null);
          
        if (error) throw error;
        toast.success("You are no longer interested in this event");
      } else {
        // Add interest
        const { error } = await supabase
          .from("event_attendees")
          .insert({
            event_id: eventId.toString(),
            user_id: user.id,
            check_in_time: null
          });
          
        if (error) throw error;
        toast.success("You are now interested in this event");
      }
      
      // Ensure the database has time to update before we allow realtime updates again
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fetch the accurate state from the database after updates
      await fetchUserInterest();
      await fetchInterestCount();
      
    } catch (error: any) {
      console.error("Error updating interest:", error);
      toast.error(error.message || "Failed to update interest");
      
      // Revert local state on error
      setIsInterested(!isInterested);
      setInterestedCount(prevCount => isInterested ? prevCount - 1 : prevCount + 1);
    } finally {
      // Turn off isUpdating
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
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
            <h1 className="text-2xl font-bold mb-2">{event?.title}</h1>
            
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
              disabled={isUpdating}
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
