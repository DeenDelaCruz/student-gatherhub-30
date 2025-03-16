
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Auth callback page - Auth state:", { loading, isAuthenticated: !!user });

    // Handle the auth callback immediately for non-loading states
    if (!loading) {
      if (user) {
        console.log("User authenticated in callback, redirecting to home");
        navigate("/home", { replace: true });
      } else {
        // If not loading and no user, authentication failed
        toast.error("Authentication failed. Please try again.");
        navigate("/auth", { replace: true });
      }
      return;
    }

    // Fallback timer for loading states that might get stuck
    const timer = setTimeout(() => {
      console.log("Auth callback timeout reached, current state:", { loading, isAuthenticated: !!user });
      
      if (user) {
        navigate("/home", { replace: true });
      } else {
        toast.error("Authentication is taking too long. Please try again.");
        navigate("/auth", { replace: true });
      }
    }, 5000); // Longer timeout for slow connections

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
      <p className="mt-4 text-gray-600">Completing sign in...</p>
      <p className="mt-2 text-sm text-gray-500">Please wait while we verify your credentials.</p>
    </div>
  );
};

export default AuthCallback;
