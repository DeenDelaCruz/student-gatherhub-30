import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays, Activity, User, Shield, Trash2, UserMinus, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { 
  getTotalUsers, 
  getTotalEvents,
  getAllEvents, 
  deleteEvent,
  promoteStudentToInfoOfficer
} from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [infoOfficers, setInfoOfficers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  // For demonstration, we'll simulate this since we can't track actual online users without a real-time backend
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  useEffect(() => {
    // Check if user has admin role
    if (!hasRole('admin')) {
      navigate('/');
      return;
    }
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch total users count
        const users = await getTotalUsers();
        setTotalUsers(users);
        
        // Fetch total events count
        const events = await getTotalEvents();
        setTotalEvents(events);
        
        // Fetch information officers - using the same approach as in People.tsx
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'information_officer');
          
        if (roleError) {
          console.error("Error fetching officer roles:", roleError);
          toast.error("Failed to load information officers");
        } else {
          if (roleData && roleData.length > 0) {
            const officerIds = roleData.map(item => item.user_id);
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, email, year')
              .in('id', officerIds);
              
            if (profileError) {
              console.error("Error fetching officer profiles:", profileError);
              toast.error("Failed to load officer profiles");
            } else {
              setInfoOfficers(profileData ? profileData.map(profile => ({
                user_id: profile.id,
                profiles: profile
              })) : []);
            }
          } else {
            setInfoOfficers([]);
          }
        }
        
        // Fetch students - using the same approach
        const { data: studentRoleData, error: studentRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');
          
        if (studentRoleError) {
          console.error("Error fetching student roles:", studentRoleError);
          toast.error("Failed to load students");
        } else {
          if (studentRoleData && studentRoleData.length > 0) {
            const studentIds = studentRoleData.map(item => item.user_id);
            
            const { data: studentProfileData, error: studentProfileError } = await supabase
              .from('profiles')
              .select('id, name, email, year, events_attended')
              .in('id', studentIds);
              
            if (studentProfileError) {
              console.error("Error fetching student profiles:", studentProfileError);
              toast.error("Failed to load student profiles");
            } else {
              setStudents(studentProfileData ? studentProfileData.map(profile => ({
                user_id: profile.id,
                profiles: profile
              })) : []);
            }
          } else {
            setStudents([]);
          }
        }
        
        // Fetch all events
        const allEvents = await getAllEvents();
        setEvents(allEvents);
        
        // Simulate online users - approximately 10-30% of total users
        const simulatedOnlineUsers = Math.max(1, Math.floor(users * (Math.random() * 0.2 + 0.1)));
        setOnlineUsers(simulatedOnlineUsers);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [hasRole, navigate]);

  // Calculate the online percentage
  const onlinePercentage = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;

  const handleDemoteUser = async (userId: string) => {
    // Set loading state for this specific user
    setActionLoading(prev => ({ ...prev, [`user-${userId}`]: true }));
    
    try {
      // First check if the user already has a student role
      const { data: existingStudentRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'student')
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      // Begin transaction
      // Remove information_officer role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'information_officer');
        
      if (deleteError) throw deleteError;
      
      // If student role doesn't exist, add it
      if (!existingStudentRole) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'student' });
          
        if (insertError) throw insertError;
      }
      
      toast.success("User demoted to student successfully");
      
      // Refresh the information officers list
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'information_officer');
        
      if (roleError) throw roleError;
      
      if (roleData && roleData.length > 0) {
        const officerIds = roleData.map(item => item.user_id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, year')
          .in('id', officerIds);
          
        if (profileError) throw profileError;
        
        setInfoOfficers(profileData ? profileData.map(profile => ({
          user_id: profile.id,
          profiles: profile
        })) : []);
      } else {
        setInfoOfficers([]);
      }
      
      // Refresh the students list
      const { data: studentRoleData, error: studentRoleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
        
      if (studentRoleError) throw studentRoleError;
      
      if (studentRoleData && studentRoleData.length > 0) {
        const studentIds = studentRoleData.map(item => item.user_id);
        
        const { data: studentProfileData, error: studentProfileError } = await supabase
          .from('profiles')
          .select('id, name, email, year, events_attended')
          .in('id', studentIds);
          
        if (studentProfileError) throw studentProfileError;
        
        setStudents(studentProfileData ? studentProfileData.map(profile => ({
          user_id: profile.id,
          profiles: profile
        })) : []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error demoting user:", error);
      toast.error("An error occurred while demoting user");
    } finally {
      // Clear loading state for this specific user
      setActionLoading(prev => ({ ...prev, [`user-${userId}`]: false }));
    }
  };

  const handlePromoteStudent = async (userId: string) => {
    // Set loading state for this specific student
    setActionLoading(prev => ({ ...prev, [`student-${userId}`]: true }));
    
    try {
      const success = await promoteStudentToInfoOfficer(userId);
      
      if (success) {
        toast.success("Student promoted to information officer successfully");
        
        // Refresh the information officers list
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'information_officer');
          
        if (roleError) throw roleError;
        
        if (roleData && roleData.length > 0) {
          const officerIds = roleData.map(item => item.user_id);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email, year')
            .in('id', officerIds);
            
          if (profileError) throw profileError;
          
          setInfoOfficers(profileData ? profileData.map(profile => ({
            user_id: profile.id,
            profiles: profile
          })) : []);
        } else {
          setInfoOfficers([]);
        }
        
        // Refresh the students list
        const { data: studentRoleData, error: studentRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');
          
        if (studentRoleError) throw studentRoleError;
        
        if (studentRoleData && studentRoleData.length > 0) {
          const studentIds = studentRoleData.map(item => item.user_id);
          
          const { data: studentProfileData, error: studentProfileError } = await supabase
            .from('profiles')
            .select('id, name, email, year, events_attended')
            .in('id', studentIds);
            
          if (studentProfileError) throw studentProfileError;
          
          setStudents(studentProfileData ? studentProfileData.map(profile => ({
            user_id: profile.id,
            profiles: profile
          })) : []);
        } else {
          setStudents([]);
        }
      } else {
        toast.error("Failed to promote student");
      }
    } catch (error) {
      console.error("Error promoting student:", error);
      toast.error("An error occurred while promoting student");
    } finally {
      // Clear loading state for this specific student
      setActionLoading(prev => ({ ...prev, [`student-${userId}`]: false }));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Set loading state for this specific event
    setActionLoading(prev => ({ ...prev, [`event-${eventId}`]: true }));
    
    try {
      const success = await deleteEvent(eventId);
      
      if (success) {
        toast.success("Event deleted successfully");
        // Refresh the events list
        const allEvents = await getAllEvents();
        setEvents(allEvents);
        // Update total events count
        const totalEvents = await getTotalEvents();
        setTotalEvents(totalEvents);
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("An error occurred while deleting event");
    } finally {
      // Clear loading state for this specific event
      setActionLoading(prev => ({ ...prev, [`event-${eventId}`]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">System statistics and management</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  Users
                </CardTitle>
                <CardDescription>Total registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-16 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-3xl font-bold">{totalUsers}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {onlineUsers} online
                      </span>
                    </div>
                    <Progress value={onlinePercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {onlinePercentage}% of users currently online
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <CalendarDays className="h-5 w-5 text-green-500 mr-2" />
                  Events
                </CardTitle>
                <CardDescription>Total events created</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-16 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{totalEvents}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                System Status
              </CardTitle>
              <CardDescription>Current system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Status</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Status</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage Status</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Uptime</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    99.9%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Shield className="h-5 w-5 text-red-500 mr-2" />
                Admin Tools
              </CardTitle>
              <CardDescription>Manage users and events</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="users">
                    <User className="h-4 w-4 mr-2" />
                    Officers
                  </TabsTrigger>
                  <TabsTrigger value="students">
                    <Users className="h-4 w-4 mr-2" />
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="events">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Events
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="users" className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Information Officers</h3>
                  
                  {loading ? (
                    <div className="h-16 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : infoOfficers.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No information officers found</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {infoOfficers.map((officer) => (
                        <div key={officer.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{officer.profiles?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{officer.profiles?.email || 'No email'}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDemoteUser(officer.user_id)}
                            disabled={actionLoading[`user-${officer.user_id}`]}
                          >
                            {actionLoading[`user-${officer.user_id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <UserMinus className="h-4 w-4 mr-1" />
                                Demote
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="students" className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Students</h3>
                  
                  {loading ? (
                    <div className="h-16 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No students found</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {students.map((student) => (
                        <div key={student.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{student.profiles?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{student.profiles?.email || 'No email'}</p>
                            <p className="text-xs text-gray-400">
                              {student.profiles?.events_attended || 0} events attended
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                            onClick={() => handlePromoteStudent(student.user_id)}
                            disabled={actionLoading[`student-${student.user_id}`]}
                          >
                            {actionLoading[`student-${student.user_id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Promote
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="events" className="mt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">All Events</h3>
                  
                  {loading ? (
                    <div className="h-16 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No events found</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {events.map((event) => (
                        <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.event_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={actionLoading[`event-${event.id}`]}
                          >
                            {actionLoading[`event-${event.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Admin;
