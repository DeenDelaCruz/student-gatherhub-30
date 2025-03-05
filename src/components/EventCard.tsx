
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarClock, Users, UsersCheck, QrCode, Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase, getEventInterestCount, getEventCheckedInCount } from "@/integrations/supabase/client";

interface EventCardProps {
  title: string;
  imageSrc: string;
  id: number | string;
  attendees?: number;
  isActive?: boolean;
  date?: Date;
  onClick?: () => void;
  className?: string;
  createdBy?: string;
}

const EventCard = ({ 
  title, 
  imageSrc, 
  id, 
  attendees: initialAttendees = 0, 
  isActive = true,
  date,
  onClick, 
  className,
  createdBy
}: EventCardProps) => {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  const [active, setActive] = useState(isActive);
  const [interestedCount, setInterestedCount] = useState(initialAttendees);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const canEdit = isInformationOfficer && createdBy === user?.id;

  // Fetch current attendee counts on mount
  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (id) {
        try {
          // Get interested users count
          const interested = await getEventInterestCount(id.toString());
          setInterestedCount(interested);
          
          // Get checked-in users count
          const checkedIn = await getEventCheckedInCount(id.toString());
          setCheckedInCount(checkedIn);
        } catch (error) {
          console.error("Error fetching attendee counts:", error);
        }
      }
    };
    
    fetchAttendeeCounts();
    
    // Subscribe to changes in event attendees table
    const channel = supabase
      .channel(`event-interest-${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_attendees',
          filter: `event_id=eq.${id}` 
        }, 
        () => {
          // Refresh counts when there's a change
          fetchAttendeeCounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleEditEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
      navigate(`/edit-event/${id.toString()}`);
    } else {
      toast.info(`Viewing event: ${title}`);
    }
  };

  const handleViewAttendees = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/scanner");
    // Set a small timeout to allow the page to load before switching to the attendees tab
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        const attendeesTab = tabsElement.querySelector('[value="attendees"]') as HTMLElement;
        if (attendeesTab) {
          attendeesTab.click();
        }
      }
    }, 100);
  };

  const handleGenerateQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/scanner");
  };

  const toggleEventStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("You can only change status of events you created");
      return;
    }
    
    const newStatus = !active;
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_active: newStatus })
        .eq("id", id.toString());
        
      if (error) throw error;
      
      setActive(newStatus);
      toast.success(`Event ${newStatus ? 'activated' : 'deactivated'}: ${title}`);
    } catch (error: any) {
      console.error("Error updating event status:", error);
      toast.error(error.message || "Failed to update event status");
    }
  };

  const handleCardClick = () => {
    // Allow viewing inactive events for information officers
    if (!active && !isInformationOfficer) {
      toast.info("This event is no longer active");
      return;
    }
    navigate(`/event/${id.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-all",
        !active && !isInformationOfficer ? "opacity-60 cursor-default" : "cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="relative h-32 w-full overflow-hidden">
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
        />
        {date && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {date.toLocaleDateString()}
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-medium">
            INACTIVE
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        
        {isInformationOfficer && (
          <div className="mt-3 flex flex-wrap gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("text-xs h-7 px-2", canEdit ? "text-blue-500" : "")}
              onClick={handleEditEvent}
            >
              {canEdit ? <Edit className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {canEdit ? "Edit" : "View"}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={handleViewAttendees}
            >
              <Users className="h-3 w-3 mr-1" /> {interestedCount}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={handleViewAttendees}
            >
              <UsersCheck className="h-3 w-3 mr-1" /> {checkedInCount}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={handleGenerateQR}
            >
              <QrCode className="h-3 w-3 mr-1" /> QR
            </Button>
            
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7 px-2"
                onClick={toggleEventStatus}
              >
                {active ? (
                  <><ToggleRight className="h-3 w-3 mr-1" /> Active</>
                ) : (
                  <><ToggleLeft className="h-3 w-3 mr-1" /> Inactive</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
