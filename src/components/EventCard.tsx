
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventCardProps {
  title: string;
  imageSrc: string;
  onClick?: () => void;
  className?: string;
}

const EventCard = ({ title, imageSrc, onClick, className }: EventCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-all cursor-pointer",
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
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
    </motion.div>
  );
};

export default EventCard;
