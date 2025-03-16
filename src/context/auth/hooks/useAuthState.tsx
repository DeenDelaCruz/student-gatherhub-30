
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
    const storedSession = sessionStorage.getItem('auth_session');
    return storedSession ? JSON.parse(storedSession) : null;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [profile, setProfile] = useState<any | null>(() => {
    const storedProfile = sessionStorage.getItem('auth_profile');
    return storedProfile ? JSON.parse(storedProfile) : null;
  });
  
  const [roles, setRoles] = useState<UserRole[]>(() => {
    const storedRoles = sessionStorage.getItem('auth_roles');
    return storedRoles ? JSON.parse(storedRoles) : [];
  });
  
  const [loading, setLoading] = useState<boolean>(() => {
    return !(sessionStorage.getItem('auth_initialized') === 'true');
  });

  // Update sessionStorage when auth state changes
  useEffect(() => {
    if (session) {
      sessionStorage.setItem('auth_session', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('auth_session');
    }
  }, [session]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      sessionStorage.setItem('auth_profile', JSON.stringify(profile));
    } else {
      sessionStorage.removeItem('auth_profile');
    }
  }, [profile]);

  useEffect(() => {
    if (roles.length > 0) {
      sessionStorage.setItem('auth_roles', JSON.stringify(roles));
    } else {
      sessionStorage.removeItem('auth_roles');
    }
  }, [roles]);

  useEffect(() => {
    if (!loading) {
      sessionStorage.setItem('auth_initialized', 'true');
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
      
      // Clear sessionStorage
      sessionStorage.removeItem('auth_session');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_profile');
      sessionStorage.removeItem('auth_roles');
      sessionStorage.removeItem('auth_initialized');
      
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
