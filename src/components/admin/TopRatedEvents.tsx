
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventAverageRating } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface TopRatedEvent {
  id: string;
  title: string;
  averageRating: number;
}

interface TopRatedEventsProps {
  events: any[];
}

export const TopRatedEvents = ({ events }: TopRatedEventsProps) => {
  const [topEvents, setTopEvents] = useState<TopRatedEvent[]>([]);

  useEffect(() => {
    const fetchRatings = async () => {
      const eventsWithRatings = await Promise.all(
        events.map(async (event) => {
          const rating = await getEventAverageRating(event.id);
          return {
            id: event.id,
            title: event.title,
            averageRating: rating
          };
        })
      );

      const sortedEvents = eventsWithRatings
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      setTopEvents(sortedEvents);
    };

    if (events.length > 0) {
      fetchRatings();
    }
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Top Rated Events
        </CardTitle>
        <CardDescription>Events with highest average ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topEvents.map((event, index) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                <span className="font-medium">{event.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{event.averageRating.toFixed(1)}</span>
              </div>
            </div>
          ))}
          {topEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No rated events yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
