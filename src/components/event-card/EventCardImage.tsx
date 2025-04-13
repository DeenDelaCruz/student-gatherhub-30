
import { ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventCardImageProps {
  imageSrc: string;
  title: string;
  date?: Date;
  isActive: boolean;
  onImageClick: (e: React.MouseEvent) => void;
}

const EventCardImage = ({ 
  imageSrc, 
  title, 
  date, 
  isActive,
  onImageClick
}: EventCardImageProps) => {
  return (
    <div className="relative h-32 w-full overflow-hidden group">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700 cursor-zoom-in"
        onClick={onImageClick}
      />
      {date && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {date.toLocaleDateString()}
        </div>
      )}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-medium">
          INACTIVE
        </div>
      )}
      
      <Button
        className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        size="sm"
        onClick={onImageClick}
        title="View full image"
      >
        <ZoomIn size={16} className="mr-1" /> View
      </Button>
    </div>
  );
};

export default EventCardImage;
