
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

  // Track user visit when authenticated
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
          
          // First check if there's an existing record for this user
          const { data: existingVisit, error: fetchError } = await supabase
            .from('user_visits')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (fetchError) {
            console.log("Error checking for existing visit:", fetchError.message);
            return;
          }
          
          if (existingVisit) {
            // Update the existing record
            const { error: updateError } = await supabase
              .from('user_visits')
              .update({ visit_time: now })
              .eq('id', existingVisit.id);
              
            if (updateError) {
              console.log("Error updating user visit:", updateError.message);
            } else {
              console.log("Updated existing user visit record for:", user.id);
            }
          } else {
            // Insert a new record if none exists
            const { error: insertError } = await supabase
              .from('user_visits')
              .insert({ user_id: user.id, visit_time: now });
              
            if (insertError) {
              console.log("Error recording user visit:", insertError.message);
            } else {
              console.log("Created new user visit record for:", user.id);
            }
          }
        } catch (error) {
          console.log("Exception in tracking user visit:", error);
        }
      };
      
      trackUserVisit();
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
          {/* Add a timeout message if loading takes too long */}
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
