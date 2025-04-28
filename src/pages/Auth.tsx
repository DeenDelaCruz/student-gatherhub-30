
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Users, MessageSquare, Activity, Star, Globe, Bell } from "lucide-react";
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

  const features = [
    {
      icon: Calendar,
      title: "Smart Event Discovery",
      description: "Find and track campus events effortlessly with our intelligent calendar interface. Filter events by your interests, departments, or student organizations.",
      details: ["Real-time updates and notifications", "Personalized event recommendations", "One-click registration process"]
    },
    {
      icon: Users,
      title: "Campus Community Hub",
      description: "Connect with fellow students, join organizations, and build your network through shared interests and activities.",
      details: ["Join student groups instantly", "Connect with event organizers", "Build your campus network"]
    },
    {
      icon: MessageSquare,
      title: "Interactive Discussions",
      description: "Engage in meaningful conversations, share feedback, and collaborate with event participants and organizers.",
      details: ["Live event discussions", "Direct messaging system", "Community feedback channels"]
    },
    {
      icon: Activity,
      title: "Event Analytics & Insights",
      description: "Get detailed insights into event performance, attendance trends, and engagement metrics.",
      details: ["Real-time attendance tracking", "Engagement analytics", "Feedback collection"]
    },
    {
      icon: Star,
      title: "Tailored Experience",
      description: "Enjoy a personalized event feed based on your interests, past attendance, and campus involvement.",
      details: ["Smart event recommendations", "Customizable preferences", "Event history tracking"]
    },
    {
      icon: Globe,
      title: "Campus-Wide Integration",
      description: "Access a unified platform connecting all university departments, organizations, and student groups.",
      details: ["Cross-department event access", "Unified calendar system", "Organization directory"]
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Never miss important events with intelligent alerts and reminders customized to your schedule.",
      details: ["Customizable notifications", "Calendar integration", "Priority alerts"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with Enhanced Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <h1 className="text-8xl lg:text-9xl font-bold tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-8">
            NEU EVENTERA
          </h1>
          <p className="text-2xl lg:text-3xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Transform your campus experience with NEU EventEra — where every event becomes an opportunity to connect, learn, and grow.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative">
          {/* Features Section with Enhanced Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="grid gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="glass-card p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-6">
                      <feature.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                      <div>
                        <h3 className="text-white font-semibold text-xl mb-3">{feature.title}</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                        <ul className="grid grid-cols-1 gap-3">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="text-sm text-gray-500 flex items-center gap-3 group-hover:text-gray-400 transition-colors">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full group-hover:bg-white/50 transition-colors"></span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Auth Card with Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:sticky lg:top-8"
          >
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-10 border border-white/10 shadow-2xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Welcome to EventEra
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Sign in with your Northeastern account to discover and manage campus events
                </p>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                className="w-full py-8 flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-gray-800 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                  </g>
                </svg>
                <span className="text-lg font-medium">Continue with Google</span>
              </Button>

              <p className="text-gray-500 text-sm mt-8 text-center">
                Protected by Google Authentication
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center text-gray-400"
        >
          <p className="text-sm">
            © 2025 NEU EventEra. All rights reserved. A Northeastern University initiative.
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Auth;
