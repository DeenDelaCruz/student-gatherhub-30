
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type UserRole = 'admin' | 'information_officer' | 'student';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for role-based access when component mounts
    if (!loading && user && allowedRoles && !allowedRoles.some(role => hasRole(role))) {
      toast.error("You don't have permission to access this page");
    }
  }, [loading, user, allowedRoles, hasRole]);

  // If still loading, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-campus-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If roles are specified, check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    // If user doesn't have the required role, we could either:
    // 1. Redirect to a forbidden page
    // 2. Show an access denied message
    // 3. Redirect to home page
    // For now, let's redirect to home page
    return <Navigate to="/" replace />;
  }

  // If authenticated and has required role (or no role specified), show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
