
export interface SubEvent {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  date_time: string;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}
