
import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { User, Calendar, Bell, Settings, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Profile = () => {
  const [user] = useState({
    name: "Admin Royal",
    email: "admin.royal@university.edu",
    year: "Senior",
    events: {
      attended: 12,
      upcoming: 3
    },
    notifications: true
  });

  const menuItems = [
    { icon: Calendar, label: "My Events", count: user.events.attended },
    { icon: Bell, label: "Notifications", toggle: user.notifications },
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
              <h2 className="text-xl font-medium">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className="inline-block bg-gray-100 text-xs px-2 py-1 rounded-full mt-1">
                {user.year}
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
                {user.events.attended}
              </p>
              <p className="text-sm text-gray-500">Events Attended</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex-1">
              <p className="text-2xl font-semibold text-campus-purple">
                {user.events.upcoming}
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
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Profile;
