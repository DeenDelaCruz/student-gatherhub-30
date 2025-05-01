
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, MapPin, Upload, Clock } from "lucide-react";
import { format, parse, set } from "date-fns";
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
  onEventUpdated?: (event: Event) => void;
}

const EventForm = ({ event, isEditing = false, onEventUpdated }: EventFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    event_date: event?.event_date ? new Date(event.event_date) : new Date(),
    image_url: event?.image_url || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    is_active: event?.is_active ?? true,
  });
  
  // Extract time from the event date to initialize time state
  const [time, setTime] = useState(() => {
    if (event?.event_date) {
      const date = new Date(event.event_date);
      return format(date, "HH:mm");
    }
    return format(new Date(), "HH:mm"); // Default to current time
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Preserve the selected time when changing the date
      const newDate = preserveTimeWhenChangingDate(date);
      setFormData((prev) => ({ ...prev, event_date: newDate }));
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    
    // Update the event_date with the new time while keeping the existing date
    if (newTime && formData.event_date) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = set(formData.event_date, { hours, minutes });
      setFormData((prev) => ({ ...prev, event_date: newDate }));
    }
  };
  
  // Helper function to preserve the selected time when changing the date
  const preserveTimeWhenChangingDate = (newDate: Date): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    return set(newDate, { hours, minutes });
  };

  const handleActiveToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if user is authenticated
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    try {
      setIsUploading(true);
      
      // Upload the file with user ID as the owner
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
      
      if (data) {
        setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
        toast.success("Image uploaded successfully");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createNotificationsForNewEvent = async (eventId: string, eventTitle: string) => {
    try {
      // Get all profiles, not just ones with notifications enabled
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id");
        
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        console.log("No users found");
        return;
      }
      
      console.log(`Creating notifications for ${profiles.length} users about new event`);
      
      const notifications = profiles.map(profile => ({
        user_id: profile.id,
        title: "New Event Available",
        message: `A new event "${eventTitle}" has been added. Check it out!`,
        type: "event",
        related_id: eventId,
        read: false
      }));
      
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);
        
      if (notificationError) throw notificationError;
      
      console.log(`Successfully created ${notifications.length} notifications`);
    } catch (error) {
      console.error("Error creating notifications:", error);
    }
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
        const updatedEvent = {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          event_date: formData.event_date.toISOString(),
          image_url: formData.image_url,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from("events")
          .update(updatedEvent)
          .eq("id", event.id);
          
        if (error) throw error;
        
        // If an onEventUpdated callback was provided, call it with the updated event
        if (onEventUpdated) {
          onEventUpdated({
            ...event,
            ...updatedEvent
          });
        } else {
          toast.success("Event updated successfully");
          navigate("/");
        }
      } else {
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert({
            title: formData.title,
            description: formData.description,
            location: formData.location,
            event_date: formData.event_date.toISOString(),
            image_url: formData.image_url,
            is_active: formData.is_active,
            created_by: user.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        if (newEvent) {
          await createNotificationsForNewEvent(newEvent.id, formData.title);
        }
        
        toast.success("Event created successfully");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">Event Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter event title"
          required
          className="bg-dark-400 border-dark-border text-white"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter event description"
          rows={4}
          className="bg-dark-400 border-dark-border text-white"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location" className="text-gray-300">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter event location"
            className="pl-10 bg-dark-400 border-dark-border text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date" className="text-gray-300">Event Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-dark-400 border-dark-border hover:bg-dark-300",
                  !formData.event_date && "text-gray-400"
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
            <PopoverContent className="w-auto p-0 bg-dark-300 border-dark-border">
              <Calendar
                mode="single"
                selected={formData.event_date}
                onSelect={handleDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto bg-dark-300 text-white")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="event_time" className="text-gray-300">Event Time *</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="event_time"
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="pl-10 bg-dark-400 border-dark-border text-white"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-gray-300">Event Image</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-gray-300">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="Enter image URL"
              className="bg-dark-400 border-dark-border text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image_upload" className="text-gray-300">Or upload an image</Label>
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                id="image_upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden" // Hide the native file input
              />
              {/* Custom styled button */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={triggerFileInput}
                className="flex items-center gap-2 bg-dark-400 border-dark-border hover:bg-dark-300"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {isUploading && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-campus-purple"></div>
              )}
            </div>
          </div>
        </div>
        
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
        <Label htmlFor="is_active" className="text-gray-300">Event is active</Label>
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/")}
          className="flex-1 bg-dark-400 border-dark-border hover:bg-dark-300"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-campus-accent hover:bg-campus-accent/90 text-white"
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
