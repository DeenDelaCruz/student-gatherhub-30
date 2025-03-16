
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Auth callback page - Auth state:", { loading, isAuthenticated: !!user });

    // Give the auth system a moment to process the sign-in
    const timer = setTimeout(() => {
      // If there's a user, we're authenticated
      if (user) {
        console.log("User authenticated in callback, redirecting to home");
        navigate("/home", { replace: true });
      } else if (!loading) {
        // If not loading and no user, authentication failed
        toast.error("Authentication failed. Please try again.");
        navigate("/auth", { replace: true });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
      <p className="mt-4 text-gray-600">Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;
