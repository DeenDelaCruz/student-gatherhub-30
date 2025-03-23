
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'information_officer' | 'student';

export interface RoleWithName {
  role: UserRole;
  user_name: string | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  roles: UserRole[];
  rolesWithNames: RoleWithName[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  refreshProfileData: (userId: string) => Promise<void>;
}
