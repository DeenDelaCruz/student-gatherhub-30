
import { useState, useEffect } from "react";
import { supabase, getEventInterestCount, getEventCheckedInCount } from "@/integrations/supabase/client";

export const useEventCardData = (id: number | string, initialAttendees: number = 0, isActive: boolean = true) => {
  const [active, setActive] = useState(isActive);
  const [interestedCount, setInterestedCount] = useState(initialAttendees);
  const [checkedInCount, setCheckedInCount] = useState(0);
  
  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (id) {
        try {
          const interested = await getEventInterestCount(id.toString());
          setInterestedCount(interested);
          
          const checkedIn = await getEventCheckedInCount(id.toString());
          setCheckedInCount(checkedIn);
        } catch (error) {
          console.error("Error fetching attendee counts:", error);
        }
      }
    };
    
    fetchAttendeeCounts();
    
    const interestChannel = supabase
      .channel(`event-interest-${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_interested',
          filter: `event_id=eq.${id}` 
        }, 
        () => {
          fetchAttendeeCounts();
        }
      )
      .subscribe();
      
    const attendeesChannel = supabase
      .channel(`event-attendees-${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees_new',
          filter: `event_id=eq.${id}` 
        }, 
        () => {
          fetchAttendeeCounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(interestChannel);
      supabase.removeChannel(attendeesChannel);
    };
  }, [id]);
  
  return { active, setActive, interestedCount, checkedInCount };
};
