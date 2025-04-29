
import { User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Define app roles
export type UserRole = Database['public']['Enums']['app_role'];

// User profile type 
export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  year: string | null;
  updated_at: string | null;
  events_attended?: number;
  events_upcoming?: number;
  notifications?: boolean;
  created_at?: string;
  department?: string | null;
  program?: string | null;
  student_number?: string | null;
};

// Auth context type
export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  roles?: UserRole[];
  signOut?: () => Promise<boolean>; // Changed from Promise<void> to Promise<boolean>
  hasRole: (role: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
}
