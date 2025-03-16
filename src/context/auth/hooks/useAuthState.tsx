
import { useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfileData } from '../utils';
import { UserRole } from '../types';

/**
 * Hook for managing the authentication state
 */
export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load profile data for a user
  const refreshProfileData = async (userId: string) => {
    try {
      const profileData = await fetchProfileData(userId);
      setProfile(profileData);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    }
  };

  // Sign out the current user
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Clear all auth state
      setSession(null);
      setUser(null);
      setProfile(null);
      setRoles([]);
      
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      throw error; // Re-throw to let component handle the error
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  return {
    session,
    setSession,
    user,
    setUser,
    profile,
    setProfile,
    roles,
    setRoles,
    loading,
    setLoading,
    refreshProfileData,
    signOut,
    hasRole,
  };
};
