
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
    setAuthInitialized,
    loading,
    authInitialized
  } = authState;

  useEffect(() => {
    // Set up authentication listener
    const setupAuth = async () => {
      try {
        console.log("Setting up auth...");
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }

        console.log("Initial session:", initialSession ? "exists" : "null");
        
        // If we have a user, load profile and roles
        if (initialSession?.user) {
          const userId = initialSession.user.id;
          
          // Set session and user immediately to prevent auth state flashing
          setSession(initialSession);
          setUser(initialSession.user);
          
          try {
            // Load user profile and roles in parallel
            const [profileData, userRoles] = await Promise.all([
              fetchProfileData(userId),
              fetchUserRoles(userId)
            ]);
            
            setProfile(profileData);
            setRoles(userRoles);
            
            // Track user visit in the background (don't await)
            safeTrackUserVisit(userId).catch(err => {
              console.error("Background track visit failed:", err);
            });
          } catch (error) {
            console.error("Error loading user data:", error);
          } finally {
            // Always complete the auth flow
            setLoading(false);
            setAuthInitialized(true);
          }
        } else {
          // No user, complete auth flow
          setSession(null);
          setUser(null);
          setLoading(false);
          setAuthInitialized(true);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Immediately update session and user to prevent redirection loops
              setSession(session);
              setUser(session.user);
              setLoading(true); // Set loading while fetching profile data
              
              const userId = session.user.id;
              
              try {
                // Load user profile and roles in parallel
                const [profileData, userRoles] = await Promise.all([
                  fetchProfileData(userId),
                  fetchUserRoles(userId)
                ]);
                
                setProfile(profileData);
                setRoles(userRoles);
                
                // Track the visit in the background without blocking auth flow
                safeTrackUserVisit(userId).catch(err => {
                  console.error("Background track visit failed:", err);
                });
              } catch (error) {
                console.error("Error loading data after sign in:", error);
              } finally {
                // Ensure we're not in loading state
                setLoading(false);
              }
            } else if (event === 'SIGNED_OUT') {
              // Clear user data on sign out
              setSession(null);
              setUser(null);
              setProfile(null);
              setRoles([]);
              setLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
              // Just update the session
              setSession(session);
            } else if (event === 'USER_UPDATED') {
              // Update user data
              setSession(session);
              setUser(session?.user || null);
            } else if (event === 'INITIAL_SESSION') {
              // This is handled by the initial getSession call
              console.log("Initial session event");
            }
          }
        );
        
        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in auth setup:", error);
        // Ensure loading is set to false even on errors
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    setupAuth();

    // Add a safety timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (loading && !authInitialized) {
        console.warn("Auth loading timed out - forcing completion");
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [setSession, setUser, setProfile, setRoles, setLoading, setAuthInitialized, loading, authInitialized]);
};
