
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
};

// Auth context type
export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
}
