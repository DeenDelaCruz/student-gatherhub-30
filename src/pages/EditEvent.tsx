
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import EventForm from "@/components/EventForm";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Event, convertSupabaseEventToEvent } from "@/types/event";
import { toast } from "sonner";

const EditEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { hasRole, user, loading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissionAndFetchEvent = async () => {
      // Check if user has permission to edit events
      if (!loading && !hasRole('information_officer') && !hasRole('admin')) {
        toast.error("You don't have permission to edit events");
        navigate("/");
        return;
      }

      if (!eventId) {
        toast.error("Event ID is missing");
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (error) throw error;
        
        if (!data) {
          toast.error("Event not found");
          navigate("/");
          return;
        }

        // Convert Supabase data to our Event type
        const eventData = convertSupabaseEventToEvent(data);

        // Check if user is the creator of the event
        if (user?.id !== eventData.created_by) {
          toast.error("You can only edit events you created");
          navigate("/");
          return;
        }

        setEvent(eventData);
      } catch (error: any) {
        console.error("Error fetching event:", error);
        toast.error(error.message || "Failed to fetch event");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissionAndFetchEvent();
  }, [eventId, hasRole, user, loading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-medium mb-6">Edit Event</h1>
          {event && <EventForm event={event} isEditing={true} />}
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default EditEvent;
