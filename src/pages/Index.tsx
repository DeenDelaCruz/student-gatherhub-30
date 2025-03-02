
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
import EventCard from "@/components/EventCard";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

// Mock data for events
const EVENTS = [
  {
    id: 1,
    title: "Comp Sci General Assembly 2025",
    imageSrc: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    date: new Date(2025, 0, 15)
  },
  {
    id: 2,
    title: "CICS Freshmen Orientation",
    imageSrc: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    date: new Date(2025, 0, 18)
  },
  {
    id: 3,
    title: "Alumni Networking Event",
    imageSrc: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    date: new Date(2025, 0, 21)
  },
  {
    id: 4,
    title: "Hackathon Spring 2025",
    imageSrc: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    date: new Date(2025, 0, 25)
  }
];

const Index = () => {
  const [filteredEvents, setFilteredEvents] = useState(EVENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [username, setUsername] = useState("Admin Royal");

  useEffect(() => {
    // Simulate receiving a notification
    const timer = setTimeout(() => {
      toast("New Event", {
        description: "Hackathon Spring 2025 registration is now open!",
        position: "top-center",
        duration: 5000,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredEvents(EVENTS);
      return;
    }
    
    const filtered = EVENTS.filter(event => 
      event.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const handleDateSelect = (date: Date) => {
    // Filter events by date
    const filtered = EVENTS.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
    
    setFilteredEvents(filtered.length ? filtered : EVENTS);
    
    if (filtered.length) {
      toast(`${filtered.length} event(s) found on ${date.toLocaleDateString()}`);
    } else {
      toast(`No events on ${date.toLocaleDateString()}`);
    }
  };

  const handleEventClick = (eventId: number) => {
    // In a real app, this would navigate to event details
    toast(`Opening details for event #${eventId}`);
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header onSearch={handleSearch} />
      
      <main className="flex-1 p-4">
        <div className="welcome-section mb-5 animate-fade-in">
          <h1 className="text-xl font-medium">Hello, {username}!</h1>
        </div>
        
        <Calendar onDateSelect={handleDateSelect} />
        
        <div className="events-section">
          <h2 className="text-lg font-medium mb-4 pb-2 border-b border-gray-200">
            All active events
          </h2>
          
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                imageSrc={event.imageSrc}
                onClick={() => handleEventClick(event.id)}
              />
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No events found for "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Index;
