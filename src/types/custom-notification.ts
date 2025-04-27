
export interface CustomNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  read: boolean;
  user_id: string;
  created_at: string;
}
