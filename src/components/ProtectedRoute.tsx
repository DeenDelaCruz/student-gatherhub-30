
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
          
          // First check if user already has a visit record within the last hour
          // This is to prevent creating new records on page refreshes or navigation
          const { data: recentVisits, error: recentVisitsError } = await supabase
            .rpc('get_recent_user_visits', { 
              user_id_param: user.id, 
              minutes_ago: 60 // Check visits within the last hour
            });
            
          if (recentVisitsError) {
            console.log("Error checking recent visits:", recentVisitsError.message);
            
            // Fallback: direct check if the RPC function fails
            const { data: existingVisit, error: fetchError } = await supabase
              .from('user_visits')
              .select('id')
              .eq('user_id', user.id)
              .order('visit_time', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (fetchError) {
              console.log("Error checking existing visit:", fetchError.message);
              return;
            }
            
            if (existingVisit) {
              // Update existing visit record
              const { error: updateError } = await supabase
                .from('user_visits')
                .update({ visit_time: now })
                .eq('id', existingVisit.id);
                
              if (updateError) {
                console.log("Error updating user visit:", updateError.message);
              } else {
                console.log("Updated existing visit record for:", user.id);
              }
            } else {
              // Insert new visit record
              const { error: insertError } = await supabase
                .from('user_visits')
                .insert({ user_id: user.id, visit_time: now });
                
              if (insertError) {
                console.log("Error creating user visit:", insertError.message);
              } else {
                console.log("Created new visit record for:", user.id);
              }
            }
            return;
          }
          
          // If we have recent visits, update the most recent one
          if (recentVisits && recentVisits.length > 0) {
            const mostRecentVisit = recentVisits[0];
            
            // Update existing visit record using RPC function for better security
            const { error: updateError } = await supabase
              .rpc('update_user_visit', { 
                visit_id_param: mostRecentVisit.id, 
                time_param: now 
              });
              
            if (updateError) {
              console.log("Error updating user visit via RPC:", updateError.message);
              
              // Fallback: direct update if the RPC function fails
              const { error: directUpdateError } = await supabase
                .from('user_visits')
                .update({ visit_time: now })
                .eq('id', mostRecentVisit.id);
                
              if (directUpdateError) {
                console.log("Error with direct update of user visit:", directUpdateError.message);
              } else {
                console.log("Updated existing visit record via direct update for:", user.id);
              }
            } else {
              console.log("Updated existing visit record via RPC for:", user.id);
            }
          } else {
            // No recent visits, create a new record using RPC function
            const { error: createError } = await supabase
              .rpc('create_user_visit', { 
                user_id_param: user.id, 
                time_param: now 
              });
              
            if (createError) {
              console.log("Error creating user visit via RPC:", createError.message);
              
              // Fallback: direct insert if the RPC function fails
              const { error: directInsertError } = await supabase
                .from('user_visits')
                .insert({ user_id: user.id, visit_time: now });
                
              if (directInsertError) {
                console.log("Error with direct creation of user visit:", directInsertError.message);
              } else {
                console.log("Created new visit record via direct insert for:", user.id);
              }
            } else {
              console.log("Created new visit record via RPC for:", user.id);
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
