
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Bell, CalendarCheck, InfoIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Notification } from "@/types/notification";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch notifications from Supabase
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Explicitly cast the data to match our Notification type
        const typedNotifications = data?.map(item => ({
          ...item,
          type: item.type as 'event' | 'info' | 'reminder'
        })) || [];
        
        setNotifications(typedNotifications);
      } catch (error: any) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user?.id}` 
        },
        (payload) => {
          console.log('Notification change received:', payload);
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Realtime notification subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      toast.success("Marked as read");
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // If the notification is related to an event, navigate to the event details page
    if (notification.type === 'event' || notification.type === 'reminder') {
      if (notification.related_id) {
        navigate(`/event/${notification.related_id}`);
      }
    }
    
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'event':
        return <CalendarCheck size={18} className="text-blue-600" />;
      case 'reminder':
        return <Bell size={18} className="text-amber-600" />;
      case 'info':
      default:
        return <InfoIcon size={18} className="text-green-600" />;
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      toast.success(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Notifications</h2>
          
          {notifications.filter(n => !n.read).length > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm text-campus-accent hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-campus-accent"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                className={`bg-white rounded-xl p-4 shadow-sm relative ${!notification.read ? 'border-l-4 border-campus-accent' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`bg-gray-100 rounded-full p-2 mr-3 ${!notification.read ? 'bg-campus-accent/10' : ''}`}>
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${!notification.read ? 'text-campus-accent' : ''}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-campus-accent hover:underline mt-2"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-campus-accent"></span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        )}
      </main>
      
      <Navigation />
    </div>
  );
};

export default Notifications;
