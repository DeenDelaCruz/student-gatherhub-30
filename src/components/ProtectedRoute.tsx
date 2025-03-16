
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Show permission error only when authentication is complete and user lacks necessary role
  useEffect(() => {
    if (!loading && user && allowedRoles && !allowedRoles.some(role => hasRole(role))) {
      toast.error("You don't have permission to access this page");
    }
  }, [loading, user, allowedRoles, hasRole]);

  console.log("ProtectedRoute - Auth state:", { loading, isAuthenticated: !!user, path: location.pathname });

  // Special case for /auth page - allow direct access without protection
  if (location.pathname === "/auth") {
    return <>{children}</>;
  }

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-campus-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
          <p className="mt-2 text-sm text-gray-500">
            If this takes too long, try refreshing the page
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
    return <Navigate to="/home" replace />;
  }

  // If authenticated and has required role (or no role specified), show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
