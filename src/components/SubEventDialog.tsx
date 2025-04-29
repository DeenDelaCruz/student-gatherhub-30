
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { SubEvent } from "@/types/sub-event";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { format, parse, set } from "date-fns";

const subEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date_time: z.string().min(1, "Date and time is required"),
  location: z.string().optional(),
  image_url: z.string().optional(),
});

type SubEventFormData = z.infer<typeof subEventSchema>;

interface SubEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubEventFormData) => Promise<void>;
  subEvent?: SubEvent;
}

export const SubEventDialog = ({ isOpen, onClose, onSubmit, subEvent }: SubEventDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Create separate state for date and time inputs
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  
  const form = useForm<SubEventFormData>({
    resolver: zodResolver(subEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date_time: "",
      location: "",
      image_url: "",
    },
  });

  // Initialize date and time when subEvent changes or on initial load
  useEffect(() => {
    if (subEvent) {
      const eventDate = new Date(subEvent.date_time);
      setDateInput(format(eventDate, 'yyyy-MM-dd'));
      setTimeInput(format(eventDate, 'HH:mm'));
      
      form.reset({
        title: subEvent.title,
        description: subEvent.description || "",
        date_time: eventDate.toISOString().slice(0, 16),
        location: subEvent.location || "",
        image_url: subEvent.image_url || "",
      });
    } else {
      setDateInput('');
      setTimeInput('');
      form.reset({
        title: "",
        description: "",
        date_time: "",
        location: "",
        image_url: "",
      });
    }
  }, [subEvent, form]);

  // Handle separate date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);
    updateCombinedDateTime(newDate, timeInput);
  };

  // Handle separate time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeInput(newTime);
    updateCombinedDateTime(dateInput, newTime);
  };

  // Update the combined date_time field in the form
  const updateCombinedDateTime = (date: string, time: string) => {
    if (!date || !time) return;
    
    try {
      // Parse date and time strings to create a proper Date object
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      // Month is 0-indexed in JavaScript Date
      const dateObj = new Date(year, month - 1, day, hours, minutes);
      
      // Set the combined date_time in the form using ISO format
      form.setValue('date_time', dateObj.toISOString());
      
      console.log('Updated date_time:', dateObj.toISOString());
    } catch (error) {
      console.error("Error updating combined date time:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    try {
      setIsUploading(true);
      
      const { error: uploadError, data } = await supabase.storage
        .from('sub_event_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrl } = supabase.storage
        .from('sub_event_images')
        .getPublicUrl(fileName);
      
      if (publicUrl) {
        form.setValue('image_url', publicUrl.publicUrl);
        toast.success("Image uploaded successfully");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (data: SubEventFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{subEvent ? "Edit Sub-Event" : "Add Sub-Event"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={dateInput}
                  onChange={handleDateChange}
                  required
                />
              </FormItem>
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  value={timeInput}
                  onChange={handleTimeChange}
                  required
                />
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="date_time"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <div className="space-y-4">
                    {field.value && (
                      <div className="relative h-48 w-full overflow-hidden rounded-md">
                        <img
                          src={field.value}
                          alt="Sub-event preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {field.value && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => form.setValue('image_url', '')}
                        >
                          Remove Image
                        </Button>
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
