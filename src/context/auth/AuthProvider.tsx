
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
  const [mounted, setMounted] = useState(false);

  // Fetch user profile data
  const fetchProfileData = async (userId: string) => {
    if (!userId) return;
    
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      console.log("Fetched profile data:", profileData);
      
      // Create a profile object that matches our Profile type
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
        created_at: profileData.created_at,
        department: profileData.department,
        program: profileData.program,
        student_number: profileData.student_number
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
      // First update the local state to ensure UI updates immediately
      setUser(null);
      setProfile(null);
      setRoles([]);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Successfully signed out');
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      // Reset state even if there's an error with Supabase
      setUser(null);
      setProfile(null);
      setRoles([]);
      throw error;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      console.log("Refreshing profile for user:", user.id);
      await fetchProfileData(user.id);
    }
  };

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  useEffect(() => {
    // Set mounted state to true to indicate component has mounted
    setMounted(true);
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth system...');
        // First, set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state changed:', event, !!session);
            
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setRoles([]);
              setLoading(false);
              return;
            }
            
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Use setTimeout to prevent potential deadlock with Supabase auth
              setTimeout(() => {
                fetchProfileData(session.user.id);
              }, 0);
            } else {
              setProfile(null);
              setRoles([]);
            }
            
            setLoading(false);
          }
        );
        
        // Then, get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', !!session);
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent potential deadlock
          setTimeout(() => {
            fetchProfileData(session.user.id);
          }, 0);
        }
        
        setLoading(false);
        
        return () => {
          if (subscription) subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      setMounted(false);
    };
  }, []);

  // Only render children when mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, hasRole, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
