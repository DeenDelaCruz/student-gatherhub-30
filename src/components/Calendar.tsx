
import { useState, useEffect } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  addMonths, 
  subMonths,
  isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  events?: Array<{date: Date; isActive: boolean}>;
  onFilterChange?: (filterType: "active" | "inactive") => void;
  filterType?: "active" | "inactive";
}

const Calendar = ({ onDateSelect, events = [], onFilterChange, filterType: externalFilterType }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localFilterType, setLocalFilterType] = useState<"active" | "inactive">("active");
  
  // Use external filter type if provided, otherwise use local state
  const activeFilterType = externalFilterType || localFilterType;
  
  // Generate days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleFilterChange = (type: "active" | "inactive") => {
    setLocalFilterType(type);
    if (onFilterChange) {
      onFilterChange(type);
    }
  };

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Function to go to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Function to check if a day has events and if they match the current filter
  const getDayEventStatus = (day: Date) => {
    // For demo purposes, if no real events are provided, we'll simulate some
    if (!events || events.length === 0) {
      // Simulate events (only for demo purposes when no real events are provided)
      const hasEvent = day.getDate() % 3 === 0;
      if (!hasEvent) return { hasEvent: false, matchesFilter: false };
      
      // For simulated events, we'll consider odd days as active and even days as inactive
      const isActiveEvent = day.getDate() % 2 !== 0;
      return { 
        hasEvent: true, 
        matchesFilter: activeFilterType === "active" ? isActiveEvent : !isActiveEvent
      };
    }

    // With real events
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });

    if (dayEvents.length === 0) return { hasEvent: false, matchesFilter: false };

    // Check if any events match the current filter
    const matchingEvents = dayEvents.filter(event => 
      activeFilterType === "active" ? event.isActive : !event.isActive
    );

    return { 
      hasEvent: true, 
      matchesFilter: matchingEvents.length > 0
    };
  };
  
  // Check if current displayed month is the current month
  const isCurrentMonth = isSameMonth(currentDate, new Date());
  
  return (
    <div className="bg-white rounded-3xl p-6 mb-5 shadow-sm animate-slide-in">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToPreviousMonth}
            className="mr-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h2 className="font-semibold text-xl">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextMonth}
            className="ml-1"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="ml-2 text-xs"
            >
              Today
            </Button>
          )}
        </div>
        
        <div className="flex bg-gray-100 rounded-full">
          <button
            onClick={() => handleFilterChange("active")}
            className={cn(
              "py-1 px-4 text-sm rounded-full transition-all",
              activeFilterType === "active" 
                ? "bg-black text-white" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange("inactive")}
            className={cn(
              "py-1 px-4 text-sm rounded-full transition-all",
              activeFilterType === "inactive" 
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
          const { hasEvent, matchesFilter } = getDayEventStatus(day);
          
          return (
            <button
              key={i}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full text-sm transition-all mx-auto",
                isToday(day) && "border border-campus-accent text-campus-accent",
                hasEvent && matchesFilter 
                  ? "bg-[#9FCBDE] text-white font-medium" // Updated highlight with new color #9FCBDE
                  : hasEvent 
                    ? "bg-gray-200 text-gray-400" // Dimmed background for non-matching event days 
                    : "text-gray-500 hover:bg-gray-100" // Regular days
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
