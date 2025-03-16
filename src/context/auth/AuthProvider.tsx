import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { trackUserVisit } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: any | null;
  roles: string[];
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authenticationSetup = async () => {
      // Load the initial session
      const initialSession = await supabase.auth.getSession();
      setSession(initialSession.data.session);
      setUser(initialSession.data.session?.user || null);
      
      // Set auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Track the user visit when they sign in
          await trackUserVisit(session.user.id);
        }

        if (session?.user) {
          // Fetch user roles
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          if (rolesError) {
            console.error("Error fetching user roles:", rolesError);
            setRoles([]);
          } else {
            const userRoles = rolesData ? rolesData.map(item => item.role) : [];
            setRoles(userRoles);
          }
        } else {
          setRoles([]);
        }
      });

      setIsLoading(false);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }

    const checkSession = async () => {
      await getSession()
      setIsLoading(false)
    }

    checkSession()
    authenticationSetup();
  }, []);

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Check your email for the magic link to sign in.');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const value: AuthContextType = {
    session,
    user,
    roles,
    isLoading,
    signIn,
    signOut,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
