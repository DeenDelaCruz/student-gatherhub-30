
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
          
          // Call the custom function to get recent visits
          const { data: recentVisits, error: fetchError } = await supabase
            .rpc('get_recent_user_visits', { 
              user_id_param: user.id,
              minutes_ago: 15
            });
            
          if (fetchError) {
            console.log("Error checking recent visits:", fetchError.message);
            return;
          }
          
          // Check if we got any recent visits in the response
          if (recentVisits && Array.isArray(recentVisits) && recentVisits.length > 0) {
            console.log(`Skipping visit record - user ${user.id} has visited within the last 15 minutes`);
            return;
          }
          
          // No recent visits found, insert a new visit record
          console.log(`No recent visits found for user ${user.id}, creating new visit record`);
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
      }, 500); // Increased to 500ms for more reliability
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, location.pathname]); // Added location.pathname to help with different pages

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
