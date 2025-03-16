
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
    const authenticationSetup = async () => {
      // Load the initial session
      const initialSession = await supabase.auth.getSession();
      setSession(initialSession.data.session);
      setUser(initialSession.data.session?.user || null);
      
      if (initialSession.data.session?.user) {
        // Load the user's profile and roles
        const userId = initialSession.data.session.user.id;
        const profileData = await fetchProfileData(userId);
        setProfile(profileData);
        
        const userRoles = await fetchUserRoles(userId);
        setRoles(userRoles);
        
        // Track the user visit when they sign in
        await trackUserVisit(userId);
      }
      
      // Set auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Track the user visit when they sign in
          await trackUserVisit(session.user.id);
          
          // Load user profile and roles
          const userId = session.user.id;
          const profileData = await fetchProfileData(userId);
          setProfile(profileData);
          
          const userRoles = await fetchUserRoles(userId);
          setRoles(userRoles);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
        }
      });

      setLoading(false);
    };

    authenticationSetup();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
