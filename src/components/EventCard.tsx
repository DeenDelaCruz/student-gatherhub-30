import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarClock, Users, UserCheck, QrCode, Edit, Eye, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase, getEventInterestCount, getEventCheckedInCount, getEventAverageRating, getEventRatingCount } from "@/integrations/supabase/client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import Lightbox from "@/components/Lightbox";
import RatingStars from "./RatingStars";
import { convertUrlsToLinks } from "@/utils/textUtils";
import { createGoogleCalendarLink } from "@/utils/calendarUtils";

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
  description?: string;
  location?: string;
  interestCount?: number; // Added interestCount property to the interface
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
  createdBy,
  description,
  location
}: EventCardProps) => {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  const [active, setActive] = useState(isActive);
  const [interestedCount, setInterestedCount] = useState(initialAttendees);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const canEdit = isInformationOfficer && createdBy === user?.id;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const eventDate = date ? new Date(date) : null;
  const isPastEvent = eventDate ? eventDate < new Date() : false;

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

  useEffect(() => {
    const fetchRatingData = async () => {
      if (!id || !isPastEvent) return;
      
      try {
        const avgRating = await getEventAverageRating(id.toString());
        const ratingCount = await getEventRatingCount(id.toString());
        
        setAverageRating(avgRating);
        setRatingCount(ratingCount);
      } catch (error) {
        console.error('Error fetching rating data:', error);
      }
    };

    fetchRatingData();
  }, [id, isPastEvent]);

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
    if (!active && !isInformationOfficer) {
      toast.info("This event is no longer active");
      return;
    }
    navigate(`/event/${id.toString()}`);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOpen(true);
  };

  const handleAddToGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!date) return;
    
    const calendarUrl = createGoogleCalendarLink(
      title,
      description || "",
      location || "",
      date,
      // End time defaults to 1 hour later in the utility function
    );
    
    window.open(calendarUrl, '_blank');
    toast.success("Opening Google Calendar...");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-[#14162199] backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden mb-4 shadow-lg hover:shadow-[#8E6BF5]/10 transition-all",
          !active && !isInformationOfficer ? "opacity-60 cursor-default" : "cursor-pointer",
          className
        )}
        onClick={handleCardClick}
      >
        <div className="relative h-32 w-full overflow-hidden">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-700 cursor-zoom-in"
            onClick={handleImageClick}
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
          <h3 className="font-medium text-white">{title}</h3>
          
          {isPastEvent && averageRating > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <RatingStars rating={Math.round(averageRating)} readonly size={16} />
              <span className="text-xs text-gray-400">
                ({ratingCount})
              </span>
            </div>
          )}
          
          <div className="mt-3 flex flex-wrap gap-1">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-white hover:bg-white/5"
                  onClick={handleViewDetails}
                >
                  <Eye className="h-3 w-3 mr-1" /> View
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-[#14162199] backdrop-blur-xl border border-white/5 rounded-xl shadow-lg text-white">
                <div className="relative h-36 w-full overflow-hidden">
                  <img 
                    src={imageSrc} 
                    alt={title} 
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={handleImageClick}
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
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-2 text-white">{title}</h3>
                  
                  {date && (
                    <div className="flex items-center mb-2 text-sm text-gray-300">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span>{format(date, 'MMMM d, yyyy - h:mm a')}</span>
                    </div>
                  )}
                  
                  {location && (
                    <div className="flex items-center mb-2 text-sm text-gray-300">
                      <span className="font-medium mr-1">Location:</span> {location}
                    </div>
                  )}
                  
                  <div className="flex items-center mb-2 text-sm text-gray-300">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{interestedCount} interested</span>
                  </div>
                  
                  {description && (
                    <div className="mt-2 mb-3">
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {convertUrlsToLinks(description)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="w-full bg-[#8E6BF5] text-white hover:bg-[#7d5be0]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverOpen(false);
                        navigate(`/event/${id.toString()}`);
                      }}
                    >
                      View Full Details
                    </Button>
                    
                    {active && date && new Date(date) > new Date() && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 text-white border-white/10 hover:bg-white/5"
                        onClick={handleAddToGoogleCalendar}
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {isInformationOfficer && (
              <>
                {canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-[#8E6BF5] hover:bg-[#8E6BF5]/10"
                    onClick={handleEditEvent}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-white hover:bg-white/5"
                  onClick={handleViewAttendees}
                >
                  <Users className="h-3 w-3 mr-1" /> {interestedCount}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-white hover:bg-white/5"
                  onClick={handleViewAttendees}
                >
                  <UserCheck className="h-3 w-3 mr-1" /> {checkedInCount}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-white hover:bg-white/5"
                  onClick={handleGenerateQR}
                >
                  <QrCode className="h-3 w-3 mr-1" /> QR
                </Button>
                
                {canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 px-2 bg-[#1A1F2C99] border-white/5 text-white hover:bg-white/5"
                    onClick={toggleEventStatus}
                  >
                    {active ? (
                      <><ToggleRight className="h-3 w-3 mr-1 text-status-active" /> Active</>
                    ) : (
                      <><ToggleLeft className="h-3 w-3 mr-1 text-gray-400" /> Inactive</>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
      
      <Lightbox 
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageSrc={imageSrc}
        alt={title}
      />
    </>
  );
};

export default EventCard;
