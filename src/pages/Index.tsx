import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
import EventCard from "@/components/EventCard";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { supabase, createEventReminderNotifications } from "@/integrations/supabase/client";
import { Event, convertSupabaseEventsToEvents } from "@/types/event";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const Index = () => {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order('event_date', { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          toast.error(error.message || "Failed to fetch events");
          setEvents([]);
          setFilteredEvents([]);
          return;
        }
        
        if (data) {
          const formattedEvents = convertSupabaseEventsToEvents(data);
          setEvents(formattedEvents);
          setFilteredEvents(formattedEvents);
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast.error(error.message || "Failed to fetch events");
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Change received!', payload);
          fetchEvents(); // Refetch events when changes occur
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const checkEventReminders = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('event-reminders', {
            method: 'POST',
          });
          
          if (error) {
            console.error('Error checking event reminders:', error);
          } else {
            console.log('Event reminders check completed:', data);
          }
        } catch (error) {
          console.error('Error invoking event-reminders function:', error);
        }
      };
      
      checkEventReminders();
      
      const reminderInterval = setInterval(checkEventReminders, 6 * 60 * 60 * 1000);
      
      return () => {
        clearInterval(reminderInterval);
      };
    }
  }, [user]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const handleDateSelect = (date: Date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= selectedDate && eventDate < nextDay;
    });
    
    setFilteredEvents(filtered.length ? filtered : events);
    
    if (filtered.length) {
      toast(`${filtered.length} event(s) found on ${date.toLocaleDateString()}`);
    } else {
      toast(`No events on ${date.toLocaleDateString()}`);
    }
  };

  const handleEventClick = (eventId: string | number) => {
    navigate(`/event/${eventId}`);
  };

  const handleCreateEvent = () => {
    navigate("/create-event");
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header onSearch={handleSearch} />
      
      <main className="flex-1 p-4">
        <div className="welcome-section mb-5 animate-fade-in">
          <h1 className="text-xl font-medium">Hello, {profile?.name || "User"}!</h1>
        </div>
        
        <Calendar onDateSelect={handleDateSelect} />
        
        <div className="events-section">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-lg font-medium">
              All active events
            </h2>
            
            {isInformationOfficer && (
              <Button 
                onClick={handleCreateEvent}
                size="sm"
                className="flex items-center gap-1"
              >
                <PlusCircle size={16} />
                <span>Create Event</span>
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    imageSrc={event.image_url || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"}
                    date={new Date(event.event_date)}
                    isActive={event.is_active}
                    onClick={() => handleEventClick(event.id)}
                    createdBy={event.created_by}
                    description={event.description}
                    location={event.location}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? `No events found for "${searchTerm}"` : "No events available"}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Index;
