
import { useState } from "react";

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
    <div className="relative h-32 w-full overflow-hidden">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform hover:scale-105 duration-700 cursor-zoom-in"
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
    </div>
  );
};

export default EventCardImage;
