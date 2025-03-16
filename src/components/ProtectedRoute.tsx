
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
          
          // Use upsert to update if exists or insert if not
          const { error: upsertError } = await supabase
            .from('user_visits')
            .upsert(
              { user_id: user.id, visit_time: now },
              { onConflict: 'user_id', ignoreDuplicates: false }
            );
            
          if (upsertError) {
            console.log("Error tracking user visit:", upsertError.message);
          } else {
            console.log("Updated user visit record for:", user.id);
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

  // Function to clear all visitor records - for admin use
  const clearVisitorRecords = async () => {
    try {
      if (!user || !hasRole('admin')) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to clear visitor records"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('user_visits')
        .delete()
        .neq('id', 'placeholder'); // This will delete all records
        
      if (error) {
        console.error("Error clearing visitor records:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to clear visitor records: " + error.message
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "All visitor records have been cleared"
      });
      return true;
    } catch (error) {
      console.error("Exception clearing visitor records:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while clearing visitor records"
      });
      return false;
    }
  };

  // Expose the clearVisitorRecords function to the window for admin components to use
  if (typeof window !== 'undefined' && user && hasRole('admin')) {
    // @ts-ignore
    window.adminUtils = {
      // @ts-ignore
      ...(window.adminUtils || {}),
      clearVisitorRecords
    };
  }

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
