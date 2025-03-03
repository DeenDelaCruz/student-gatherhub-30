
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Event } from "@/types/event";
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

  // Function to fetch interest state for the current user
  const fetchUserInterest = async () => {
    if (!eventId || !user) return false;
    
    try {
      const { data: interestData, error: interestError } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .is("check_in_time", null)
        .maybeSingle();
        
      if (interestError) {
        console.error("Error checking interest:", interestError);
        return false;
      }
      
      return interestData !== null;
    } catch (error: any) {
      console.error("Error fetching user interest:", error);
      return false;
    }
  };

  // Function to fetch just the count
  const fetchInterestCount = async () => {
    if (!eventId) return 0;
    
    try {
      const { count, error: countError } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .is("check_in_time", null);
        
      if (countError) {
        console.error("Error fetching interest count:", countError);
        return 0;
      }
      
      return count || 0;
    } catch (error: any) {
      console.error("Error fetching interest count:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData as Event);
        
        // Get interest count
        const count = await fetchInterestCount();
        setInterestedCount(count);
        
        // Check if user is interested
        if (user) {
          const userIsInterested = await fetchUserInterest();
          setIsInterested(userIsInterested);
        }
        
      } catch (error: any) {
        console.error("Error fetching event details:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();

    // Clean up previous subscription if it exists
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [eventId, user]);

  // Setup real-time subscription in a separate effect
  useEffect(() => {
    if (!eventId || isUpdating) return;

    // Set up real-time subscription for interest updates
    const channel = supabase
      .channel(`event-attendees-${eventId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees',
          filter: `event_id=eq.${eventId}` 
        }, 
        async () => {
          // Only update if we're not in the middle of toggling
          if (!isUpdating) {
            // Just update the count, don't change the user's own interest state
            const count = await fetchInterestCount();
            setInterestedCount(count);
            
            // Only update the user's interest state if they're logged in and not toggling
            if (user) {
              const userIsInterested = await fetchUserInterest();
              setIsInterested(userIsInterested);
            }
          }
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, isUpdating, user]);

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

      if (newInterestedState === false) {
        // Remove interest
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .is("check_in_time", null);
          
        if (error) throw error;
        toast.success("You are no longer interested in this event");
      } else {
        // Add interest
        const { error } = await supabase
          .from("event_attendees")
          .insert({
            event_id: eventId,
            user_id: user.id,
            check_in_time: null
          });
          
        if (error) throw error;
        toast.success("You are now interested in this event");
      }
    } catch (error: any) {
      console.error("Error updating interest:", error);
      toast.error(error.message || "Failed to update interest");
      
      // Revert local state on error
      setIsInterested(!isInterested);
      setInterestedCount(prevCount => isInterested ? prevCount - 1 : prevCount + 1);
    } finally {
      // Briefly delay turning off isUpdating to allow database to sync
      setTimeout(() => {
        setIsUpdating(false);
      }, 1000);
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
