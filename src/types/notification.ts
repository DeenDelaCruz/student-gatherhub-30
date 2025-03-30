
export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: 'event' | 'info' | 'reminder' | 'event_reminder';
  read: boolean;
  related_id?: string;
  user_id: string;
}
