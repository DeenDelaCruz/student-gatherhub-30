
import { format } from "date-fns";
import { MapPin, Calendar, Edit, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { SubEvent } from "@/types/sub-event";
import { useAuth } from "@/context/auth";

interface SubEventCardProps {
  subEvent: SubEvent;
  onEdit: (subEvent: SubEvent) => void;
  onDelete: (subEventId: string) => void;
}

export const SubEventCard = ({ subEvent, onEdit, onDelete }: SubEventCardProps) => {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin') || hasRole('information_officer');

  return (
    <Card className="w-full h-full flex flex-col">
      {subEvent.image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={subEvent.image_url}
            alt={subEvent.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{subEvent.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          {format(new Date(subEvent.date_time), 'MMMM d, yyyy - h:mm a')}
        </CardDescription>
        {subEvent.location && (
          <CardDescription className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            {subEvent.location}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600">{subEvent.description || "No description available."}</p>
      </CardContent>
      {canManage && (
        <CardFooter className="gap-2 pt-4 border-t mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(subEvent)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(subEvent.id)}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
