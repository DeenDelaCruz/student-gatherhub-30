
import { createContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, Profile, UserRole } from './types';

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const fetchProfileData = async (userId: string) => {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Create a profile object that matches our Profile type
      // including the avatar_url field which might not exist in the database
      const profileWithAvatar: Profile = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        avatar_url: null, // Set default value
        year: profileData.year,
        updated_at: profileData.updated_at,
        events_attended: profileData.events_attended,
        events_upcoming: profileData.events_upcoming,
        notifications: profileData.notifications,
        created_at: profileData.created_at
      };
      
      setProfile(profileWithAvatar);
      
      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      
      if (rolesData) {
        const userRoles = rolesData.map(r => r.role) as UserRole[];
        setRoles(userRoles);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setRoles([]);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfileData(user.id);
    }
  };

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfileData(session.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfileData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, hasRole, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
