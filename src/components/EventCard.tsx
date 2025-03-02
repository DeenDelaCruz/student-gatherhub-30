
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarClock, Users, QrCode, Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EventCardProps {
  title: string;
  imageSrc: string;
  id: number;
  attendees?: number;
  isActive?: boolean;
  date?: Date;
  onClick?: () => void;
  className?: string;
}

const EventCard = ({ 
  title, 
  imageSrc, 
  id, 
  attendees = 0, 
  isActive = true,
  date,
  onClick, 
  className 
}: EventCardProps) => {
  const { hasRole } = useAuth();
  const isInformationOfficer = hasRole('information_officer') || hasRole('admin');
  const [active, setActive] = useState(isActive);

  const handleEditEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Editing event: ${title}`);
    // In a real app, navigate to edit page or open modal
  };

  const handleViewAttendees = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Viewing ${attendees} attendees for: ${title}`);
    // In a real app, navigate to attendees page or open modal
  };

  const handleGenerateQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`QR code generated for: ${title}`);
    // In a real app, generate and display QR code
  };

  const toggleEventStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !active;
    setActive(newStatus);
    toast.success(`Event ${newStatus ? 'activated' : 'deactivated'}: ${title}`);
    // In a real app, update the event status in the database
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-all cursor-pointer",
        !active && "opacity-60",
        className
      )}
      onClick={onClick}
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
              className="text-xs h-7 px-2"
              onClick={handleEditEvent}
            >
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={handleViewAttendees}
            >
              <Users className="h-3 w-3 mr-1" /> {attendees}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={handleGenerateQR}
            >
              <QrCode className="h-3 w-3 mr-1" /> QR
            </Button>
            
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
