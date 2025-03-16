
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfileData } from '../utils';
import { UserRole } from '../types';

/**
 * Hook for managing the authentication state
 */
export const useAuthState = () => {
  // Initialize state from sessionStorage if available to prevent verification on tab switch
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const storedSession = sessionStorage.getItem('auth_session');
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (error) {
      console.error('Error parsing session from storage:', error);
      return null;
    }
  });
  
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem('auth_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  });
  
  const [profile, setProfile] = useState<any | null>(() => {
    try {
      const storedProfile = sessionStorage.getItem('auth_profile');
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (error) {
      console.error('Error parsing profile from storage:', error);
      return null;
    }
  });
  
  const [roles, setRoles] = useState<UserRole[]>(() => {
    try {
      const storedRoles = sessionStorage.getItem('auth_roles');
      return storedRoles ? JSON.parse(storedRoles) : [];
    } catch (error) {
      console.error('Error parsing roles from storage:', error);
      return [];
    }
  });
  
  const [loading, setLoading] = useState<boolean>(() => {
    // We are loading if we don't have session data yet or if initialized flag not set
    const hasSession = sessionStorage.getItem('auth_session') !== null;
    const isInitialized = sessionStorage.getItem('auth_initialized') === 'true';
    return !(isInitialized && hasSession);
  });

  // Update sessionStorage when auth state changes
  useEffect(() => {
    try {
      if (session) {
        sessionStorage.setItem('auth_session', JSON.stringify(session));
      } else {
        sessionStorage.removeItem('auth_session');
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }, [session]);

  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (profile) {
        sessionStorage.setItem('auth_profile', JSON.stringify(profile));
      } else {
        sessionStorage.removeItem('auth_profile');
      }
    } catch (error) {
      console.error('Error storing profile:', error);
    }
  }, [profile]);

  useEffect(() => {
    try {
      if (roles.length > 0) {
        sessionStorage.setItem('auth_roles', JSON.stringify(roles));
      } else {
        sessionStorage.removeItem('auth_roles');
      }
    } catch (error) {
      console.error('Error storing roles:', error);
    }
  }, [roles]);

  useEffect(() => {
    try {
      if (!loading) {
        sessionStorage.setItem('auth_initialized', 'true');
      }
    } catch (error) {
      console.error('Error storing auth initialization state:', error);
    }
  }, [loading]);

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
      console.log("Signing out user");
      setLoading(true);
      
      // First clear all local state
      setSession(null);
      setUser(null);
      setProfile(null);
      setRoles([]);
      
      // Clear sessionStorage
      sessionStorage.removeItem('auth_session');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_profile');
      sessionStorage.removeItem('auth_roles');
      sessionStorage.removeItem('auth_initialized');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
        throw error;
      }
      
      console.log("User signed out successfully");
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
