
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfileData, fetchUserRoles } from '../utils';
import { safeTrackUserVisit } from '../utils/tracking';

/**
 * Hook for setting up the authentication listeners and initial state
 */
export const useAuthSetup = (authState: any) => {
  const {
    setSession,
    setUser,
    setProfile,
    setRoles,
    setLoading,
    loading
  } = authState;

  useEffect(() => {
    let isMounted = true;
    // Set up authentication listener
    const setupAuth = async () => {
      try {
        console.log("Setting up auth...");
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          if (isMounted) setLoading(false);
          return;
        }

        console.log("Initial session:", initialSession ? "exists" : "null");
        
        // If we have a user, load profile and roles
        if (initialSession?.user) {
          const userId = initialSession.user.id;
          
          // Set session and user immediately to prevent auth state flashing
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession.user);
          }
          
          try {
            // Load user profile and roles in parallel
            const [profileData, userRoles] = await Promise.all([
              fetchProfileData(userId),
              fetchUserRoles(userId)
            ]);
            
            if (isMounted) {
              setProfile(profileData);
              setRoles(userRoles);
              setLoading(false);
            }
            
            // Track user visit in the background (don't await)
            safeTrackUserVisit(userId).catch(err => {
              console.error("Background track visit failed:", err);
            });
          } catch (error) {
            console.error("Error loading user data:", error);
            if (isMounted) setLoading(false);
          }
        } else {
          // No user, complete auth flow
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Immediately update session and user to prevent redirection loops
              if (isMounted) {
                setSession(session);
                setUser(session.user);
                setLoading(true); // Set loading while fetching profile data
              }
              
              const userId = session.user.id;
              
              try {
                // Load user profile and roles in parallel
                const [profileData, userRoles] = await Promise.all([
                  fetchProfileData(userId),
                  fetchUserRoles(userId)
                ]);
                
                if (isMounted) {
                  setProfile(profileData);
                  setRoles(userRoles);
                  setLoading(false);
                }
                
                // Track the visit in the background without blocking auth flow
                safeTrackUserVisit(userId).catch(err => {
                  console.error("Background track visit failed:", err);
                });
              } catch (error) {
                console.error("Error loading data after sign in:", error);
                if (isMounted) setLoading(false);
              }
            } else if (event === 'SIGNED_OUT') {
              // Clear user data on sign out
              if (isMounted) {
                setSession(null);
                setUser(null);
                setProfile(null);
                setRoles([]);
                setLoading(false);
              }
            } else if (event === 'TOKEN_REFRESHED') {
              // Just update the session
              if (isMounted) setSession(session);
            } else if (event === 'USER_UPDATED') {
              // Update user data
              if (isMounted) {
                setSession(session);
                setUser(session?.user || null);
              }
            }
          }
        );
        
        // Cleanup function
        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in auth setup:", error);
        // Ensure loading is set to false even on errors
        if (isMounted) setLoading(false);
      }
    };

    setupAuth();

    // Add a safety timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (loading && isMounted) {
        console.warn("Auth loading timed out - forcing completion");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [setSession, setUser, setProfile, setRoles, setLoading, loading]);
};
