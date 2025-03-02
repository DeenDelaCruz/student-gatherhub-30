
export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  event_date: Date;
  image_url: string;
  is_active: boolean;
}
