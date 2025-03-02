
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Calendar, Bell, Settings, ArrowRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const menuItems = [
    { icon: Calendar, label: "My Events", count: profile?.events_attended || 0 },
    { icon: Bell, label: "Notifications", toggle: profile?.notifications },
    { icon: Settings, label: "Account Settings" }
  ];

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <motion.div 
          className="profile-card bg-white rounded-3xl p-6 shadow-sm mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center">
            <div className="bg-campus-accent/10 rounded-full p-4 mr-4">
              <User size={32} className="text-campus-accent" />
            </div>
            <div>
              <h2 className="text-xl font-medium">{profile?.name || "Loading..."}</h2>
              <p className="text-gray-500 text-sm">{profile?.email || "Loading..."}</p>
              <span className="inline-block bg-gray-100 text-xs px-2 py-1 rounded-full mt-1">
                {profile?.year || "Student"}
              </span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="activity-card bg-white rounded-3xl p-6 shadow-sm mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-medium mb-4">Activity Summary</h3>
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <p className="text-2xl font-semibold text-campus-accent">
                {profile?.events_attended || 0}
              </p>
              <p className="text-sm text-gray-500">Events Attended</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex-1">
              <p className="text-2xl font-semibold text-campus-purple">
                {profile?.events_upcoming || 0}
              </p>
              <p className="text-sm text-gray-500">Upcoming Events</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="menu-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm mb-3 p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-3">
                  <item.icon size={18} className="text-gray-600" />
                </div>
                <span>{item.label}</span>
              </div>
              <div className="flex items-center">
                {typeof item.count !== 'undefined' && (
                  <span className="mr-2 bg-campus-accent/10 text-campus-accent text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
                {typeof item.toggle !== 'undefined' && (
                  <div className={`w-10 h-5 rounded-full relative ${item.toggle ? 'bg-campus-accent' : 'bg-gray-300'} transition-colors`}>
                    <div className={`absolute top-0.5 ${item.toggle ? 'right-0.5' : 'left-0.5'} bg-white h-4 w-4 rounded-full transition-all`}></div>
                  </div>
                )}
                {typeof item.count === 'undefined' && typeof item.toggle === 'undefined' && (
                  <ArrowRight size={16} className="text-gray-400" />
                )}
              </div>
            </div>
          ))}
          
          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              onClick={handleLogout}
              className="w-full mt-4 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </motion.div>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Profile;
