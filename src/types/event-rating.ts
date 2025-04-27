
export interface EventRating {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
}
