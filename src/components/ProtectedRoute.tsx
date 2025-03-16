
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type UserRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Track user visit when authenticated - with improved duplicate prevention
  useEffect(() => {
    if (user && !loading) {
      const trackUserVisit = async () => {
        try {
          // Check if the table exists by trying to select a row
          const { error: checkError } = await supabase
            .from('user_visits')
            .select('id', { count: 'exact', head: true })
            .limit(1);
          
          if (checkError) {
            console.log("User visits tracking is not available:", checkError.message);
            return;
          }
          
          const now = new Date().toISOString();
          
          // First check if user already has a visit record from ANY page
          // This query gets ALL recent visits by the user, not just for the current path
          const { data: existingVisits, error: fetchError } = await supabase
            .from('user_visits')
            .select('id, visit_time')
            .eq('user_id', user.id)
            .order('visit_time', { ascending: false });
            
          if (fetchError) {
            console.log("Error checking existing visit:", fetchError.message);
            return;
          }
          
          // If there's an existing visit, check if any are recent (within the last 15 minutes)
          // This provides stronger duplicate prevention across page navigations
          if (existingVisits && existingVisits.length > 0) {
            const currentTime = new Date(now).getTime();
            const fifteenMinutesInMs = 15 * 60 * 1000; // Increased from 5 to 15 minutes
            
            const recentVisit = existingVisits.find(visit => {
              const visitTime = new Date(visit.visit_time).getTime();
              return (currentTime - visitTime) < fifteenMinutesInMs;
            });
            
            if (recentVisit) {
              console.log(`Skipping visit record for user ${user.id} - last visit was less than 15 minutes ago`);
              return;
            }
            
            // We'll create a new record if there are no recent visits
          }
          
          // Insert new visit record since there are no recent ones
          const { error: insertError } = await supabase
            .from('user_visits')
            .insert({ 
              user_id: user.id, 
              visit_time: now 
            });
              
          if (insertError) {
            console.log("Error creating user visit:", insertError.message);
          } else {
            console.log("Created new visit record for:", user.id);
          }
        } catch (error) {
          console.log("Exception in tracking user visit:", error);
        }
      };
      
      // Add a small delay to avoid race conditions when loading or navigating quickly
      const timeoutId = setTimeout(() => {
        trackUserVisit();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading]);

  useEffect(() => {
    // Check for role-based access when component mounts and authentication is complete
    if (!loading && user && allowedRoles && !allowedRoles.some(role => hasRole(role))) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page"
      });
    }
  }, [loading, user, allowedRoles, hasRole]);

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-campus-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
          <p className="mt-2 text-sm text-gray-500">
            If this takes too long, try <a href="/auth" className="text-blue-500 hover:underline">logging in again</a>
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If roles are specified, check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    console.log("User doesn't have required role, redirecting to home page");
    return <Navigate to="/" replace />;
  }

  // If authenticated and has required role (or no role specified), show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
