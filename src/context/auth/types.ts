
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'information_officer' | 'student';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}
