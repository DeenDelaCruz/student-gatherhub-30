
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { trackUserVisit } from "@/integrations/supabase/client";
import { fetchProfileData, fetchUserRoles } from './utils';
import { AuthContextType, UserRole } from './types';

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  refreshProfileData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfileData = async (userId: string) => {
    const profileData = await fetchProfileData(userId);
    setProfile(profileData);
  };

  useEffect(() => {
    // Set up authentication listener
    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        // If we have a user, load profile and roles
        if (initialSession?.user) {
          const userId = initialSession.user.id;
          
          try {
            // Load user profile
            const profileData = await fetchProfileData(userId);
            setProfile(profileData);
            
            // Load user roles
            const userRoles = await fetchUserRoles(userId);
            setRoles(userRoles);
            
            // Track user visit
            await trackUserVisit(userId);
          } catch (error) {
            console.error("Error loading user data:", error);
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event);
            setSession(session);
            setUser(session?.user || null);
            
            if (event === 'SIGNED_IN' && session?.user) {
              const userId = session.user.id;
              
              try {
                // Track user visit
                await trackUserVisit(userId);
                
                // Load user profile and roles
                const profileData = await fetchProfileData(userId);
                setProfile(profileData);
                
                const userRoles = await fetchUserRoles(userId);
                setRoles(userRoles);
              } catch (error) {
                console.error("Error loading data after sign in:", error);
              }
            } else if (event === 'SIGNED_OUT') {
              // Clear user data on sign out
              setProfile(null);
              setRoles([]);
            }
          }
        );
        
        // Always set loading to false when done
        setLoading(false);
        
        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in auth setup:", error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing out:', error.message);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    roles,
    loading,
    signOut,
    hasRole,
    refreshProfileData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
