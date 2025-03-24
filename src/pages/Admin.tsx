
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays, Activity, User, Shield, Trash2, UserMinus, UserPlus, Clock, X } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow, subMinutes } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { clearVisitorRecords, deleteVisitorRecord } from "@/utils/adminUtils";

const Admin = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [infoOfficers, setInfoOfficers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [loadingVisitors, setLoadingVisitors] = useState<boolean>(true);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [clearingRecords, setClearingRecords] = useState<boolean>(false);

  // Define fetchVisitorsDirectly function only once
  const fetchVisitorsDirectly = async () => {
    try {
      // Get distinct user_id with most recent visit_time and now use the user_name column
      const { data: visitData, error: visitError } = await supabase
        .from('user_visits')
        .select('user_id, visit_time, user_name')
        .order('visit_time', { ascending: false })
        .limit(10);
      
      if (visitError) {
        console.error("Error fetching visits directly:", visitError);
        setRecentVisitors([]);
        setLoadingVisitors(false);
        return;
      }
      
      // If visit data has user_name, we can use it directly
      if (visitData && visitData.length > 0) {
        // We still need to get emails for the visitors
        const userIds = visitData.map(visit => visit.user_id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
          
        if (profileError) {
          console.error("Error fetching visitor profiles:", profileError);
          setRecentVisitors([]);
        } else {
          // Merge visit data with profile data, using the user_name from user_visits
          const visitors = visitData.map(visit => {
            const profile = profileData?.find(p => p.id === visit.user_id);
            return {
              user_id: visit.user_id,
              visit_time: visit.visit_time,
              name: visit.user_name || 'Unknown',
              email: profile?.email || 'No email'
            };
          });
          setRecentVisitors(visitors);
        }
      } else {
        setRecentVisitors([]);
      }
      
      setLoadingVisitors(false);
    } catch (error) {
      console.error("Error fetching visitors directly:", error);
      setRecentVisitors([]);
      setLoadingVisitors(false);
    }
  };

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
          toast({
            variant: "destructive",
            title: "Failed to load",
            description: "Failed to load information officers"
          });
        } else {
          if (roleData && roleData.length > 0) {
            const officerIds = roleData.map(item => item.user_id);
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, email, year')
              .in('id', officerIds);
              
            if (profileError) {
              console.error("Error fetching officer profiles:", profileError);
              toast({
                variant: "destructive",
                title: "Failed to load",
                description: "Failed to load officer profiles"
              });
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
        
        // Fetch students, but exclude those who are also information officers
        const { data: studentRoleData, error: studentRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');
          
        if (studentRoleError) {
          console.error("Error fetching student roles:", studentRoleError);
          toast({
            variant: "destructive",
            title: "Failed to load",
            description: "Failed to load students"
          });
        } else {
          if (studentRoleData && studentRoleData.length > 0) {
            const studentIds = studentRoleData.map(item => item.user_id);
            
            // Get information officer IDs to filter them out
            const { data: officerRoleData, error: officerCheckError } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'information_officer')
              .in('user_id', studentIds);
              
            if (officerCheckError) {
              console.error("Error checking officer roles:", officerCheckError);
              toast({
                variant: "destructive",
                title: "Failed to load",
                description: "Failed to filter students"
              });
            } else {
              // Filter out users who have both roles
              const officerUserIds = officerRoleData ? officerRoleData.map(item => item.user_id) : [];
              const pureStudentIds = studentIds.filter(id => !officerUserIds.includes(id));
              
              if (pureStudentIds.length > 0) {
                const { data: studentProfileData, error: studentProfileError } = await supabase
                  .from('profiles')
                  .select('id, name, email, year, events_attended')
                  .in('id', pureStudentIds);
                  
                if (studentProfileError) {
                  console.error("Error fetching student profiles:", studentProfileError);
                  toast({
                    variant: "destructive",
                    title: "Failed to load",
                    description: "Failed to load student profiles"
                  });
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
          } else {
            setStudents([]);
          }
        }
        
        // Fetch all events
        const allEvents = await getAllEvents();
        setEvents(allEvents);
        
        // Get actual online users based on recent visits in the last 15 minutes
        const fifteenMinutesAgo = subMinutes(new Date(), 15).toISOString();
        
        const { data: onlineVisitorsData, error: onlineVisitorsError } = await supabase
          .from('user_visits')
          .select('user_id')
          .gte('visit_time', fifteenMinutesAgo);
          
        if (onlineVisitorsError) {
          console.error("Error fetching online users:", onlineVisitorsError);
          setOnlineUsers(0);
        } else {
          // Count distinct users who visited in the last 15 minutes
          const uniqueUserIds = new Set();
          onlineVisitorsData?.forEach(visit => uniqueUserIds.add(visit.user_id));
          setOnlineUsers(uniqueUserIds.size);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast({
          variant: "destructive",
          title: "Failed to load",
          description: "Failed to load admin data"
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecentVisitors = async () => {
      try {
        setLoadingVisitors(true);
        
        // First check if the user_visits table exists
        const { count, error: tableCheckError } = await supabase
          .from('user_visits')
          .select('*', { count: 'exact', head: true })
          .limit(1);
          
        if (tableCheckError) {
          console.error("Error checking user_visits table:", tableCheckError);
          setRecentVisitors([]);
          setLoadingVisitors(false);
          return;
        }
        
        // Try to use get_recent_visitors function first, which should be updated to include user_name
        try {
          const { data, error } = await supabase.rpc('get_recent_visitors', { limit_param: 10 });
          
          if (error) {
            console.error("Error calling get_recent_visitors function:", error);
            // If function fails, fallback to direct query
            fetchVisitorsDirectly();
          } else {
            setRecentVisitors(data || []);
            setLoadingVisitors(false);
          }
        } catch (functionError) {
          console.error("RPC function error:", functionError);
          // Fallback to direct query
          fetchVisitorsDirectly();
        }
      } catch (error) {
        console.error("Error in fetchRecentVisitors:", error);
        setRecentVisitors([]);
        setLoadingVisitors(false);
      }
    };
    
    fetchStats();
    fetchRecentVisitors();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentVisitors();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [hasRole, navigate]);

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
      
      toast({
        title: "Success",
        description: "User demoted to student successfully"
      });
      
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
      toast({
        variant: "destructive",
        title: "Failed",
        description: "An error occurred while demoting user"
      });
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
        toast({
          title: "Success",
          description: "Student promoted to information officer successfully"
        });
        
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
        
        // Refresh the students list by getting only users with student role
        const { data: studentRoleData, error: studentRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');
          
        if (studentRoleError) throw studentRoleError;
        
        // Filter out users who also have information_officer role
        if (studentRoleData && studentRoleData.length > 0) {
          const studentIds = studentRoleData.map(item => item.user_id);
          
          // Check which of these students also have information_officer role
          const { data: officerRoleData, error: officerCheckError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'information_officer')
            .in('user_id', studentIds);
            
          if (officerCheckError) throw officerCheckError;
          
          // Filter out users who have both roles
          const officerUserIds = officerRoleData ? officerRoleData.map(item => item.user_id) : [];
          const pureStudentIds = studentIds.filter(id => !officerUserIds.includes(id));
          
          if (pureStudentIds.length > 0) {
            const { data: studentProfileData, error: studentProfileError } = await supabase
              .from('profiles')
              .select('id, name, email, year, events_attended')
              .in('id', pureStudentIds);
              
            if (studentProfileError) throw studentProfileError;
            
            setStudents(studentProfileData ? studentProfileData.map(profile => ({
              user_id: profile.id,
              profiles: profile
            })) : []);
          } else {
            setStudents([]);
          }
        } else {
          setStudents([]);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: "Failed to promote student"
        });
      }
    } catch (error) {
      console.error("Error promoting student:", error);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "An error occurred while promoting student"
      });
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
        toast({
          title: "Success",
          description: "Event deleted successfully"
        });
        // Refresh the events list
        const allEvents = await getAllEvents();
        setEvents(allEvents);
        // Update total events count
        const totalEvents = await getTotalEvents();
        setTotalEvents(totalEvents);
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: "Failed to delete event"
        });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "An error occurred while deleting event"
      });
    } finally {
      // Clear loading state for this specific event
      setActionLoading(prev => ({ ...prev, [`event-${eventId}`]: false }));
    }
  };

  const handleClearVisitorRecords = async () => {
    setClearingRecords(true);
    try {
      const success = await clearVisitorRecords();
      if (success) {
        // Refresh the visitor data if records were cleared successfully
        setRecentVisitors([]);
      }
    } finally {
      setClearingRecords(false);
    }
  };

  // Refresh visitor records after deletion
  const handleVisitorDeleted = () => {
    // Refresh the visitor data
    setLoadingVisitors(true);
    const fetchRecentVisitors = async () => {
      try {
        // First check if the user_visits table exists
        const { count, error: tableCheckError } = await supabase
          .from('user_visits')
          .select('*', { count: 'exact', head: true })
          .limit(1);
          
        if (tableCheckError) {
          console.error("Error checking user_visits table:", tableCheckError);
          setRecentVisitors([]);
          setLoadingVisitors(false);
          return;
        }
        
        // Try to use get_recent_visitors function first, which should be updated to include user_name
        try {
          const { data, error } = await supabase.rpc('get_recent_visitors', { limit_param: 10 });
          
          if (error) {
            console.error("Error calling get_recent_visitors function:", error);
            // If function fails, fallback to direct query
            fetchVisitorsDirectly();
          } else {
            setRecentVisitors(data || []);
            setLoadingVisitors(false);
          }
        } catch (functionError) {
          console.error("RPC function error:", functionError);
          // Fallback to direct query
          fetchVisitorsDirectly();
        }
      } catch (error) {
        console.error("Error in fetchRecentVisitors:", error);
        setRecentVisitors([]);
        setLoadingVisitors(false);
      }
    };
    
    fetchRecentVisitors();
  };

  const handleDeleteVisitorRecord = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [`visitor-${userId}`]: true }));
    try {
      const success = await deleteVisitorRecord(userId);
      if (success) {
        handleVisitorDeleted();
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`visitor-${userId}`]: false }));
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
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Users Card */}
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
          
          {/* Events Card */}
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

          {/* Recent Activity Card with ScrollArea */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Clock className="h-5 w-5 text-purple-500 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleClearVisitorRecords}
                          disabled={clearingRecords}
                        >
                          {clearingRecords ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Clear Records
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete all visitor records</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>Latest user visits</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVisitors ? (
                  <div className="h-16 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                  </div>
                ) : recentVisitors.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity available</p>
                ) : (
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-2">{recentVisitors.length} recent visitors</p>
                    <ScrollArea className={recentVisitors.length > 5 ? "h-48" : ""}>
                      <div className="space-y-2">
                        {recentVisitors.map((visitor, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <div>
                              <p className="font-medium text-sm">{visitor.name || 'Unknown user'}</p>
                              <p className="text-xs text-muted-foreground">{visitor.email || 'No email'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {visitor.visit_time ? formatDistanceToNow(new Date(visitor.visit_time), { addSuffix: true }) : 'recently'}
                              </span>
                              {hasRole('admin') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDeleteVisitorRecord(visitor.user_id)}
                                  disabled={actionLoading[`visitor-${visitor.user_id}`]}
                                >
                                  {actionLoading[`visitor-${visitor.user_id}`] ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-500"></div>
                                  ) : (
                                    <X className="h-3 w-3 text-red-500" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* System Status Card */}
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

        {/* Management Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <Tabs defaultValue="events">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events">
                <CalendarDays className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="officers">
                <Shield className="h-4 w-4 mr-2" />
                Officers
              </TabsTrigger>
              <TabsTrigger value="students">
                <User className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
            </TabsList>
            
            {/* Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Events Management</CardTitle>
                  <CardDescription>Manage all system events</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-gray-500">No events found</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell>
                                {event.event_date 
                                  ? format(new Date(event.event_date), 'MMM d, yyyy h:mm a') 
                                  : 'No date'}
                              </TableCell>
                              <TableCell>{event.location || 'No location'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  disabled={actionLoading[`event-${event.id}`]}
                                >
                                  {actionLoading[`event-${event.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Officers Tab */}
            <TabsContent value="officers">
              <Card>
                <CardHeader>
                  <CardTitle>Information Officers</CardTitle>
                  <CardDescription>Manage information officers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : infoOfficers.length === 0 ? (
                    <p className="text-sm text-gray-500">No information officers found</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {infoOfficers.map((officer) => (
                            <TableRow key={officer.user_id}>
                              <TableCell className="font-medium">{officer.profiles.name}</TableCell>
                              <TableCell>{officer.profiles.email}</TableCell>
                              <TableCell>{officer.profiles.year || 'N/A'}</TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDemoteUser(officer.user_id)}
                                        disabled={actionLoading[`user-${officer.user_id}`]}
                                      >
                                        {actionLoading[`user-${officer.user_id}`] ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        ) : (
                                          <UserMinus className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Demote to student</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Students Tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage student accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-gray-500">No students found</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Events Attended</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.user_id}>
                              <TableCell className="font-medium">{student.profiles.name}</TableCell>
                              <TableCell>{student.profiles.email}</TableCell>
                              <TableCell>{student.profiles.year || 'N/A'}</TableCell>
                              <TableCell>{student.profiles.events_attended || 0}</TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                        onClick={() => handlePromoteStudent(student.user_id)}
                                        disabled={actionLoading[`student-${student.user_id}`]}
                                      >
                                        {actionLoading[`student-${student.user_id}`] ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                        ) : (
                                          <UserPlus className="h-4 w-4 text-blue-600" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Promote to information officer</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Admin;
