import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Users, MessageSquare, Activity } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/");
          toast.success("Welcome to EventEra!");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        toast.error(`Error signing in: ${error.message}`);
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-dark-200 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 p-8"
      >
        {/* Left side - Content */}
        <div className="flex-1 text-white space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              NEU EVENTERA
            </h1>
            <p className="text-xl text-gray-400 max-w-xl">
              Your all-in-one campus event management platform. Connect, discover, and engage with events that matter.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <Calendar className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="font-semibold mb-1">Event Discovery</h3>
                  <p className="text-sm text-gray-400">Browse and track campus events, get notifications, and never miss out.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <Users className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="font-semibold mb-1">Attendance Tracking</h3>
                  <p className="text-sm text-gray-400">Monitor and manage event attendance with QR codes and real-time tracking.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <MessageSquare className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="font-semibold mb-1">Real-time Updates</h3>
                  <p className="text-sm text-gray-400">Get instant notifications about event changes and updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <Activity className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="font-semibold mb-1">Event Analytics</h3>
                  <p className="text-sm text-gray-400">Track attendance, gather feedback, and improve future events.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Auth */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-indigo-950/5 rounded-2xl p-8 border border-[#1E2042] shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Welcome to EventEra
              </h2>
              <p className="text-gray-400">
                Sign in to discover and manage campus events
              </p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              className="w-full py-6 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              <span className="text-base font-medium">Continue with Google</span>
            </Button>

            <p className="text-gray-500 text-sm mt-8 text-center">
              Secured by Google Authentication
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
