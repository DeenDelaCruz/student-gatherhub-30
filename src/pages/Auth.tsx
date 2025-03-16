
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  // Force showing the auth form after a delay regardless of loading state
  const [forceShowAuth, setForceShowAuth] = useState(false);
  
  useEffect(() => {
    console.log("Auth page - Auth state:", { loading, isAuthenticated: !!user, redirectAttempted, forceShowAuth });
    
    // If we're stuck in loading for too long, force show the auth form
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timeout - forcing auth form display");
        setForceShowAuth(true);
      }
    }, 2000); // 2 second safety timeout
    
    // If already authenticated, redirect to intended location or home
    if (!loading && user && !redirectAttempted) {
      setRedirectAttempted(true);
      const from = location.state?.from?.pathname || "/";
      console.log("User authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
    
    return () => clearTimeout(timer);
  }, [loading, user, navigate, location.state, redirectAttempted]);

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`, // Ensure we redirect back to auth to handle the redirection
        },
      });
      
      if (error) {
        toast.error(`Error signing in: ${error.message}`);
        setIsAuthenticating(false);
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      setIsAuthenticating(false);
    }
  };

  // Show loading only if not forcing auth display
  if (loading && !forceShowAuth) {
    return (
      <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 shadow-sm max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Campus Events Hub</h1>
          <p className="text-gray-500">Sign in to access events, track attendance, and more</p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isAuthenticating}
          className="w-full py-6 flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-gray-800 rounded-full"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default Auth;
