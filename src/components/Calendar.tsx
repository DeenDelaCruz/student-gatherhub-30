
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

const Calendar = ({ onDateSelect }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<"active" | "inactive">("active");
  
  // Generate days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 mb-5 shadow-sm animate-slide-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-xl">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex bg-gray-100 rounded-full">
          <button
            onClick={() => setFilterType("active")}
            className={cn(
              "py-1 px-4 text-sm rounded-full transition-all",
              filterType === "active" 
                ? "bg-black text-white" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setFilterType("inactive")}
            className={cn(
              "py-1 px-4 text-sm rounded-full transition-all",
              filterType === "inactive" 
                ? "bg-black text-white" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Inactive
          </button>
        </div>
      </div>
      
      {/* Weekdays header */}
      <div className="calendar-grid mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={index} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="calendar-grid">
        {Array(days[0].getDay())
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} className="h-9"></div>
          ))}
        
        {days.map((day, i) => {
          // Simulate events (in a real app, this would come from your data)
          const hasEvent = (day.getDate() % 3 === 0); // Just for demo purposes
          const isActive = hasEvent && filterType === "active";
          const isInactive = hasEvent && filterType === "inactive";
          
          // Only show days with events based on the current filter
          const shouldHighlight = filterType === "active" ? isActive : isInactive;
          
          return (
            <button
              key={i}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full text-sm transition-all mx-auto",
                isToday(day) && "border border-campus-accent text-campus-accent",
                shouldHighlight 
                  ? "font-medium text-black" 
                  : hasEvent 
                    ? "text-gray-300" // Dimmed text for non-matching event days
                    : "text-gray-500",
                "hover:bg-gray-100"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
