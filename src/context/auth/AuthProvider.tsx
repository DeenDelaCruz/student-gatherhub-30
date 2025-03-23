import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { UserRole, RoleWithName } from "./types";
import { fetchUserRoles, fetchProfileData, fetchRolesWithNames } from "./utils";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesWithNames, setRolesWithNames] = useState<RoleWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for:", userId);
      
      // Fetch profile data
      const profileData = await fetchProfileData(userId);
      setProfile(profileData);
      
      // Fetch user roles
      const userRoles = await fetchUserRoles(userId);
      setRoles(userRoles);
      
      // Fetch roles with names
      const rolesWithNamesData = await fetchRolesWithNames(userId);
      setRolesWithNames(rolesWithNamesData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const refreshProfileData = async (userId: string) => {
    try {
      console.log("Refreshing profile data for:", userId);
      
      // Fetch profile data
      const profileData = await fetchProfileData(userId);
      setProfile(profileData);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("Getting session...");
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Session error. Please try logging in again.");
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        console.log("Session:", session ? "Found" : "Not found");
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("Fetching user data for:", session.user.id);
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error("Session retrieval error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        
        // Only update session if it's different or we don't have one
        if (
          (event === "SIGNED_IN" && !session) || 
          (newSession?.user?.id !== session?.user?.id)
        ) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            console.log("User signed in:", newSession.user.id);
            await fetchUserData(newSession.user.id);
            navigate("/");
          }
        }
        
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setProfile(null);
          setRoles([]);
          setRolesWithNames([]);
          navigate("/auth");
        }
        
        if (event === "TOKEN_REFRESHED" && newSession?.user) {
          console.log("Token refreshed successfully");
          await fetchUserData(newSession.user.id);
        }
        
        if (event === "USER_UPDATED" && newSession?.user) {
          console.log("User updated");
          await fetchUserData(newSession.user.id);
        }
        
        // Always set loading to false after an auth state change
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out. Please try again.");
      } else {
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      roles, 
      rolesWithNames,
      loading: loading || !initialized, 
      signOut, 
      hasRole,
      refreshProfileData 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
