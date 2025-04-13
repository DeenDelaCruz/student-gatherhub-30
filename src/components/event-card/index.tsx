
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Lightbox from "@/components/Lightbox";
import EventCardImage from "./EventCardImage";
import EventCardPopover from "./EventCardPopover";
import EventCardMenu from "./EventCardMenu";
import { useEventCardData } from "./useEventCardData";

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
}

const EventCard = ({ 
  title, 
  imageSrc, 
  id, 
  attendees = 0, 
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
  const canEdit = isInformationOfficer && createdBy === user?.id;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Use custom hook to manage event data and realtime updates
  const { active, interestedCount, checkedInCount } = useEventCardData(id, attendees, isActive);

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

  const handleCardClick = () => {
    if (!active && !isInformationOfficer) {
      toast.info("This event is no longer active");
      return;
    }
    navigate(`/event/${id.toString()}`);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOpen(true);
  };

  return (
    <>
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
        <EventCardImage 
          imageSrc={imageSrc} 
          title={title} 
          date={date} 
          isActive={active} 
          onImageClick={handleImageClick} 
        />
        
        <div className="p-3">
          <h3 className="font-medium text-gray-900">{title}</h3>
          
          <div className="mt-3 flex flex-wrap gap-1">
            <EventCardPopover 
              id={id}
              title={title}
              imageSrc={imageSrc}
              date={date}
              active={active}
              interestedCount={interestedCount}
              description={description}
              location={location}
              handleImageClick={handleImageClick}
            />
            
            <EventCardMenu 
              isInformationOfficer={isInformationOfficer}
              canEdit={canEdit}
              active={active}
              id={id}
              title={title}
              interestedCount={interestedCount}
              checkedInCount={checkedInCount}
              handleViewAttendees={handleViewAttendees}
              handleGenerateQR={handleGenerateQR}
            />
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
