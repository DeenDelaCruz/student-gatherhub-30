
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  events?: Array<{date: Date; isActive: boolean}>;
}

const Calendar = ({ onDateSelect, events = [] }: CalendarProps) => {
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
        matchesFilter: filterType === "active" ? isActiveEvent : !isActiveEvent
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
      filterType === "active" ? event.isActive : !event.isActive
    );

    return { 
      hasEvent: true, 
      matchesFilter: matchingEvents.length > 0
    };
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
          const { hasEvent, matchesFilter } = getDayEventStatus(day);
          
          return (
            <button
              key={i}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full text-sm transition-all mx-auto",
                isToday(day) && "border border-campus-accent text-campus-accent",
                hasEvent && matchesFilter 
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
