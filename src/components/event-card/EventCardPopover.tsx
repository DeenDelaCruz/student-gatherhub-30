
import { CalendarClock, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface EventCardPopoverProps {
  id: number | string;
  title: string;
  imageSrc: string;
  date?: Date;
  active: boolean;
  interestedCount: number;
  description?: string;
  location?: string;
  handleImageClick: (e: React.MouseEvent) => void;
}

const EventCardPopover = ({
  id,
  title,
  imageSrc,
  date,
  active,
  interestedCount,
  description,
  location,
  handleImageClick,
}: EventCardPopoverProps) => {
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };
  
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 px-2"
          onClick={handleViewDetails}
        >
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white rounded-xl shadow-lg">
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
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          
          {date && (
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <CalendarClock className="h-3 w-3 mr-1" />
              <span>{format(date, 'MMMM d, yyyy - h:mm a')}</span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <span className="font-medium mr-1">Location:</span> {location}
            </div>
          )}
          
          <div className="flex items-center mb-2 text-sm text-gray-600">
            <Users className="h-3 w-3 mr-1" />
            <span>{interestedCount} interested</span>
          </div>
          
          {description && (
            <div className="mt-2 mb-3">
              <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(false);
              navigate(`/event/${id.toString()}`);
            }}
          >
            View Full Details
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EventCardPopover;
