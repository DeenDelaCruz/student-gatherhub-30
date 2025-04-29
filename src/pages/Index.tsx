
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
import EventCard from "@/components/event-card";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { supabase, getEventInterestCount } from "@/integrations/supabase/client";
import { Event, convertSupabaseEventsToEvents } from "@/types/event";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowDownAZ, ArrowUpAZ, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sortEvents, SortOption } from "@/utils/eventSorting";

const Index = () => {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive">("active");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');

  const calendarEvents = events.map(event => ({
    date: new Date(event.event_date),
    isActive: event.is_active
  }));

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
          
          // Fetch interest count for each event
          for (const event of formattedEvents) {
            event.interest_count = await getEventInterestCount(event.id);
          }
          
          setEvents(formattedEvents);
          
          const initialFiltered = formattedEvents.filter(event => 
            activeFilter === "active" ? event.is_active : !event.is_active
          );
          console.log(`Initial filtered events: ${initialFiltered.length} (activeFilter: ${activeFilter})`);
          setFilteredEvents(initialFiltered);
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
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter]);

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

  useEffect(() => {
    let filtered = [...events];
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered = filtered.filter(event => 
      activeFilter === "active" ? event.is_active : !event.is_active
    );
    
    filtered = sortEvents(filtered, sortOption);
    
    console.log(`Filtered events: ${filtered.length} (activeFilter: ${activeFilter})`);
    setFilteredEvents(filtered);
  }, [events, searchTerm, activeFilter, sortOption]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDateSelect = (date: Date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.event_date);
      const dateMatches = eventDate >= selectedDate && eventDate < nextDay;
      const statusMatches = activeFilter === "active" ? event.is_active : !event.is_active;
      return dateMatches && statusMatches;
    });
    
    if (filtered.length) {
      setFilteredEvents(filtered);
      toast(`${filtered.length} ${activeFilter} event(s) found on ${date.toLocaleDateString()}`);
    } else {
      toast(`No ${activeFilter} events on ${date.toLocaleDateString()}`);
      const resetFiltered = events.filter(event => 
        activeFilter === "active" ? event.is_active : !event.is_active
      );
      setFilteredEvents(resetFiltered);
    }
  };

  const handleFilterChange = (filterType: "active" | "inactive") => {
    console.log(`Filter changed to: ${filterType}`);
    setActiveFilter(filterType);
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
        
        <Calendar 
          onDateSelect={handleDateSelect} 
          events={calendarEvents} 
          onFilterChange={handleFilterChange}
          filterType={activeFilter}
        />
        
        <div className="events-section">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium">
                All {activeFilter} events
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    {sortOption.includes('asc') ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
                    <span>Sort</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption("date-desc")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("date-asc")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                    Name A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("name-desc")}>
                    Name Z-A
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("interest-desc")}>
                    Most Interested
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("interest-asc")}>
                    Least Interested
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    interestCount={event.interest_count}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 col-span-2">
                  {searchTerm ? `No events found for "${searchTerm}"` : `No ${activeFilter} events available`}
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
