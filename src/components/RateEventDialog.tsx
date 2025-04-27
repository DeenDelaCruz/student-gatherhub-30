
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RatingStars from "./RatingStars";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onRatingSubmitted?: (rating: number) => void;
}

const RateEventDialog = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle,
  onRatingSubmitted 
}: RateEventDialogProps) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("event_ratings" as any)
        .insert({
          event_id: eventId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          rating: rating,
          feedback: feedback.trim() || null,
        } as any);

      if (error) throw error;

      toast.success("Thank you for your rating!");
      onRatingSubmitted?.(rating);
      onClose();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Event: {eventTitle}</DialogTitle>
          <DialogDescription>
            Share your experience about this event. Your feedback helps improve future events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-500">How would you rate this event?</span>
            <RatingStars rating={rating} onRate={setRating} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-500">Additional feedback (optional)</label>
            <Textarea
              placeholder="Share your thoughts about the event..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateEventDialog;
