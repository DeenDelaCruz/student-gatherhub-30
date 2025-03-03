
import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { UserRole } from "./types";
import { fetchUserRoles, fetchProfileData } from "./utils";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Remove the problematic session clearing code
  // This was causing the infinite loading issue

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile data
      const profileData = await fetchProfileData(userId);
      setProfile(profileData);
      
      // Fetch user roles
      const userRoles = await fetchUserRoles(userId);
      setRoles(userRoles);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("Getting session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Session error. Please try logging in again.");
          setLoading(false);
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
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === "SIGNED_IN" && newSession?.user) {
          console.log("User signed in:", newSession.user.id);
          await fetchUserData(newSession.user.id);
          navigate("/");
        }
        
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setProfile(null);
          setRoles([]);
          navigate("/auth");
        }
        
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
          if (newSession?.user) {
            await fetchUserData(newSession.user.id);
          }
        }
        
        if (event === "USER_UPDATED") {
          console.log("User updated");
          if (newSession?.user) {
            await fetchUserData(newSession.user.id);
          }
        }
        
        setLoading(false);
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
    <AuthContext.Provider value={{ session, user, profile, roles, loading, signOut, hasRole }}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
