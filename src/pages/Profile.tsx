
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Calendar, LogOut, BarChart, MapPin, Clock, Heart, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/context/auth/types";
import { useEffect, useState } from "react";
import { getUserAttendedEvents, getUserInterestedEvents } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { profile, signOut, roles, hasRole } = useAuth();
  const navigate = useNavigate();
  const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
  const [interestedEvents, setInterestedEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'attended' | 'interested'>('attended');
  const [showEvents, setShowEvents] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTab, setCurrentTab] = useState<'info' | 'edit'>('info');

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (signOut) {
        await signOut();
        toast.success("Logged out successfully");
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigateToEventDetails = (eventId: string) => {
    navigate(`/event/${eventId}`);
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
          className="profile-card bg-dark-200 rounded-3xl p-6 shadow-md mb-6 border border-white/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center">
            <div className="bg-campus-accent/10 rounded-full p-4 mr-4">
              <User size={32} className="text-campus-accent" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">{profile?.name || "Loading..."}</h2>
              <p className="text-gray-400 text-sm">{profile?.email || "Loading..."}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles && roles.map((role, index) => (
                  <span 
                    key={index} 
                    className={`inline-block text-xs px-2 py-1 rounded-full ${
                      role === 'admin' 
                        ? 'bg-red-900/50 text-red-200' 
                        : role === 'information_officer' 
                          ? 'bg-blue-900/50 text-blue-200' 
                          : 'bg-green-900/50 text-green-200'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Tabs 
            value={currentTab} 
            className="w-full mt-4" 
            onValueChange={(val) => setCurrentTab(val as 'info' | 'edit')}
          >
            <TabsList className="bg-dark-300 w-full grid grid-cols-2">
              <TabsTrigger value="info" className="data-[state=active]:bg-campus-accent data-[state=active]:text-white">
                Info
              </TabsTrigger>
              <TabsTrigger value="edit" className="data-[state=active]:bg-campus-accent data-[state=active]:text-white">
                Edit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileForm />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="info" className="mt-4">
              {profile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {profile.year && (
                    <div className="bg-dark-300 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Year</p>
                      <p className="font-medium text-white">{profile.year}</p>
                    </div>
                  )}
                  
                  {profile.department && (
                    <div className="bg-dark-300 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Department</p>
                      <p className="font-medium text-white">{profile.department}</p>
                    </div>
                  )}
                  
                  {profile.program && (
                    <div className="bg-dark-300 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Program</p>
                      <p className="font-medium text-white">{profile.program}</p>
                    </div>
                  )}
                  
                  {profile.student_number && (
                    <div className="bg-dark-300 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Student Number</p>
                      <p className="font-medium text-white">{profile.student_number}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
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
              className="bg-dark-200 rounded-xl shadow-md mb-3 p-4 flex items-center justify-between hover:bg-dark-300 transition-colors cursor-pointer border border-white/5"
            >
              <div className="flex items-center">
                <div className="bg-dark-400 rounded-full p-2 mr-3">
                  <item.icon size={18} className="text-gray-300" />
                </div>
                <span className="text-white">{item.label}</span>
              </div>
              <div className="flex items-center">
                {typeof item.count !== 'undefined' && (
                  <span className="mr-2 bg-campus-accent/20 text-campus-accent text-xs px-2 py-1 rounded-full">
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
                <h3 className="text-md font-medium text-white">My Events</h3>
                <div className="flex bg-dark-300 rounded-full overflow-hidden">
                  <button 
                    className={`text-xs px-3 py-1 ${activeTab === 'attended' ? 'bg-campus-accent text-white' : 'text-gray-300'}`}
                    onClick={() => setActiveTab('attended')}
                  >
                    Attended
                  </button>
                  <button 
                    className={`text-xs px-3 py-1 ${activeTab === 'interested' ? 'bg-campus-accent text-white' : 'text-gray-300'}`}
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
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-white/5"
                        onClick={() => navigateToEventDetails(event.id)}
                      >
                        <div className="flex p-3">
                          {event.image_url ? (
                            <div className="w-16 h-16 bg-dark-300 rounded-md overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-dark-300 rounded-md overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                              <Calendar size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1 text-white">{event.title}</h4>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <Clock size={12} className="mr-1" />
                              <span>
                                {format(new Date(event.event_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1 text-xs text-gray-400">
                                <MapPin size={12} className="mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-dark-300 rounded-lg">
                      <Calendar className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-400 text-sm">You haven't attended any events yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {interestedEvents.length > 0 ? (
                    interestedEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-white/5"
                        onClick={() => navigateToEventDetails(event.id)}
                      >
                        <div className="flex p-3">
                          {event.image_url ? (
                            <div className="w-16 h-16 bg-dark-300 rounded-md overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-dark-300 rounded-md overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                              <Heart size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1 text-white">{event.title}</h4>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <Clock size={12} className="mr-1" />
                              <span>
                                {format(new Date(event.event_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1 text-xs text-gray-400">
                                <MapPin size={12} className="mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-dark-300 rounded-lg">
                      <Heart className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-400 text-sm">You're not interested in any upcoming events</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
          
          {hasRole('admin') && (
            <div 
              onClick={() => navigate('/admin')}
              className="bg-dark-200 rounded-xl shadow-md mb-3 p-4 flex items-center justify-between hover:bg-dark-300 transition-colors cursor-pointer border border-white/5"
            >
              <div className="flex items-center">
                <div className="bg-blue-900/30 rounded-full p-2 mr-3">
                  <BarChart size={18} className="text-blue-400" />
                </div>
                <span className="text-white">Admin Dashboard</span>
              </div>
              <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full">Stats</span>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full mt-4 bg-dark-300 hover:bg-red-900/30 text-red-400 border border-red-900/30 hover:border-red-900/50"
            >
              <LogOut size={18} className="mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </motion.div>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Profile;
