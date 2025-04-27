
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  className?: string;
}

const RatingStars = ({ 
  rating, 
  onRate, 
  readonly = false, 
  size = 20,
  className 
}: RatingStarsProps) => {
  const handleClick = (selectedRating: number) => {
    if (readonly) return;
    onRate?.(selectedRating);
  };

  return (
    <div className={cn("flex items-center", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            "cursor-pointer transition-colors",
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300",
            readonly ? "cursor-default" : "hover:text-yellow-400"
          )}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
};

export default RatingStars;
