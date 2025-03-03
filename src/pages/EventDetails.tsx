
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

  // Function to fetch interest state and count
  const fetchInterestData = async () => {
    if (!eventId) return;
    
    try {
      // Check if user is interested
      if (user) {
        const { data: interestData, error: interestError } = await supabase
          .from("event_attendees")
          .select("*")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .is("check_in_time", null);
          
        if (interestError) {
          console.error("Error checking interest:", interestError);
        } else {
          setIsInterested(interestData && interestData.length > 0);
        }
      }
      
      // Get interested count
      const { count, error: countError } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .is("check_in_time", null);
        
      if (countError) {
        console.error("Error fetching interest count:", countError);
      } else if (count !== null) {
        setInterestedCount(count);
      }
    } catch (error: any) {
      console.error("Error fetching interest data:", error);
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
        
        // Fetch interest data separately
        await fetchInterestData();
        
      } catch (error: any) {
        console.error("Error fetching event details:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();

    // Set up real-time subscription for interest updates
    const interestChannel = supabase
      .channel('public:event_attendees')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees',
          filter: `event_id=eq.${eventId}` 
        }, 
        () => {
          // Refresh interest data when changes occur
          fetchInterestData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interestChannel);
    };
  }, [eventId, user]);

  const handleToggleInterest = async () => {
    if (!user) {
      toast.error("Please log in to mark your interest");
      navigate("/auth");
      return;
    }

    try {
      if (isInterested) {
        // Remove interest
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .is("check_in_time", null);
          
        if (error) throw error;
        
        setIsInterested(false);
        setInterestedCount(prev => Math.max(0, prev - 1));
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
        
        setIsInterested(true);
        setInterestedCount(prev => prev + 1);
        toast.success("You are now interested in this event");
      }
      
      // Refresh interest data after update to ensure UI is in sync with server
      await fetchInterestData();
      
    } catch (error: any) {
      console.error("Error updating interest:", error);
      toast.error(error.message || "Failed to update interest");
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
            >
              <Heart className={`h-4 w-4 mr-2 ${isInterested ? "fill-white" : ""}`} />
              {isInterested ? "Interested" : "Mark Interested"}
            </Button>
          </div>
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default EventDetails;
