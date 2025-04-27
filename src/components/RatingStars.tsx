
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

const RatingStars = ({ rating, onRate, size = 24, readonly = false }: RatingStarsProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          } ${!readonly && "cursor-pointer hover:scale-110 transition-transform"}`}
          onClick={() => !readonly && onRate?.(star)}
        />
      ))}
    </div>
  );
};

export default RatingStars;
