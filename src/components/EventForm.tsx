
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Event, EventFormData } from "@/types/event";
import { useAuth } from "@/context/AuthContext";

interface EventFormProps {
  event?: Event;
  isEditing?: boolean;
}

const EventForm = ({ event, isEditing = false }: EventFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    event_date: event?.event_date ? new Date(event.event_date) : new Date(),
    image_url: event?.image_url || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    is_active: event?.is_active ?? true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, event_date: date }));
    }
  };

  const handleActiveToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create or edit events");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEditing && event) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update({
            title: formData.title,
            description: formData.description,
            location: formData.location,
            event_date: formData.event_date.toISOString(),
            image_url: formData.image_url,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id);
          
        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const { error } = await supabase
          .from("events")
          .insert({
            title: formData.title,
            description: formData.description,
            location: formData.location,
            event_date: formData.event_date.toISOString(),
            image_url: formData.image_url,
            is_active: formData.is_active,
            created_by: user.id,
          });
          
        if (error) throw error;
        toast.success("Event created successfully");
      }
      
      // Navigate back to events page
      navigate("/");
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter event title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter event description"
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter event location"
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event_date">Event Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.event_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.event_date ? (
                format(formData.event_date, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.event_date}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleInputChange}
          placeholder="Enter image URL"
        />
        {formData.image_url && (
          <div className="mt-2 rounded-md overflow-hidden aspect-video">
            <img 
              src={formData.image_url} 
              alt="Event preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";
              }}
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={handleActiveToggle}
        />
        <Label htmlFor="is_active">Event is active</Label>
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/")}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
