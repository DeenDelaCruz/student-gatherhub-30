
import React from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './hooks/useAuthState';
import { useAuthSetup } from './hooks/useAuthSetup';
import { AuthContextType } from './types';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Get all auth state variables and functions
  const authState = useAuthState();
  
  // Set up auth listeners and initialize state
  useAuthSetup(authState);

  const {
    session,
    user,
    profile,
    roles,
    loading,
    refreshProfileData,
    signOut,
    hasRole,
  } = authState;

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
