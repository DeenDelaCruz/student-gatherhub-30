import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { User, Calendar, LogOut, BarChart, MapPin, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/context/auth/types";
import { useEffect, useState } from "react";
import { getUserAttendedEvents, getUserInterestedEvents } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

const Profile = () => {
  const { profile, signOut, roles, hasRole } = useAuth();
  const navigate = useNavigate();
  const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
  const [interestedEvents, setInterestedEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'attended' | 'interested'>('attended');
  const [showEvents, setShowEvents] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (profile?.id) {
        const events = await getUserAttendedEvents(profile.id);
        setAttendedEvents(events);
        
        const interested = await getUserInterestedEvents(profile.id);
        setInterestedEvents(interested);
      }
    };
    
    fetchUserEvents();
  }, [profile?.id]);

  const toggleEventDisplay = () => {
    setShowEvents(!showEvents);
  };

  const menuItems = [
    { 
      icon: Calendar, 
      label: "My Events", 
      count: (activeTab === 'attended' ? profile?.events_attended : profile?.events_upcoming) || 0,
      onClick: toggleEventDisplay
    }
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
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map((role, index) => (
                  <span 
                    key={index} 
                    className={`inline-block text-xs px-2 py-1 rounded-full ${
                      role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : role === 'information_officer' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
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
              onClick={item.onClick}
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
              </div>
            </div>
          ))}
          
          {showEvents && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <div className="flex justify-between mb-2 mt-1 px-1">
                <h3 className="text-md font-medium">My Events</h3>
                <div className="flex bg-gray-100 rounded-full overflow-hidden">
                  <button 
                    className={`text-xs px-3 py-1 ${activeTab === 'attended' ? 'bg-campus-accent text-white' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('attended')}
                  >
                    Attended
                  </button>
                  <button 
                    className={`text-xs px-3 py-1 ${activeTab === 'interested' ? 'bg-campus-accent text-white' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('interested')}
                  >
                    Interested
                  </button>
                </div>
              </div>
              
              {activeTab === 'attended' ? (
                <div className="space-y-3">
                  {attendedEvents.length > 0 ? (
                    attendedEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="flex p-3">
                          {event.image_url ? (
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                              <Calendar size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock size={12} className="mr-1" />
                              <span>
                                {format(new Date(event.event_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin size={12} className="mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Calendar className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-500 text-sm">You haven't attended any events yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {interestedEvents.length > 0 ? (
                    interestedEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="flex p-3">
                          {event.image_url ? (
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                              <Heart size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock size={12} className="mr-1" />
                              <span>
                                {format(new Date(event.event_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin size={12} className="mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Heart className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-500 text-sm">You're not interested in any upcoming events</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
          
          {hasRole('admin') && (
            <div 
              onClick={() => navigate('/admin')}
              className="bg-white rounded-xl shadow-sm mb-3 p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <BarChart size={18} className="text-blue-600" />
                </div>
                <span>Admin Dashboard</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Stats</span>
            </div>
          )}
          
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
