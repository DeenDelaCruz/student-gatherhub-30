
import { Event } from "@/types/event";

export type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc";

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
    default:
      return sortedEvents;
  }
};
