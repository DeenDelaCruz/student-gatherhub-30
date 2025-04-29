
import { Event } from "@/types/event";

export type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc" | "interest-asc" | "interest-desc";

export const sortEvents = (events: Event[], sortOption: SortOption): Event[] => {
  const sortedEvents = [...events];

  switch (sortOption) {
    case "date-asc":
      return sortedEvents.sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
    case "date-desc":
      return sortedEvents.sort((a, b) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
    case "name-asc":
      return sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return sortedEvents.sort((a, b) => b.title.localeCompare(a.title));
    case "interest-asc":
      return sortedEvents.sort((a, b) => (a.interest_count || 0) - (b.interest_count || 0));
    case "interest-desc":
      return sortedEvents.sort((a, b) => (b.interest_count || 0) - (a.interest_count || 0));
    default:
      return sortedEvents;
  }
};
