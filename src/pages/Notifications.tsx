
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Bell, CalendarCheck, InfoIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: 'event' | 'info' | 'reminder';
  read: boolean;
}

// Mock notifications for demo purposes
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New Campus Event",
    message: "There's a new AI Workshop happening next week!",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'event',
    read: false
  },
  {
    id: "2",
    title: "Event Update",
    message: "The Programming Contest has been rescheduled to Friday",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    type: 'event',
    read: false
  },
  {
    id: "3",
    title: "Campus Announcement",
    message: "Library will be closed for renovations this weekend",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'info',
    read: true
  },
  {
    id: "4",
    title: "Event Reminder",
    message: "Don't forget the Career Fair tomorrow at 10 AM",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'reminder',
    read: true
  }
];

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch notifications from Supabase
    // This is where you would implement the actual data fetching
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
          setNotifications(MOCK_NOTIFICATIONS);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const markAsRead = (id: string) => {
    // In a real app, this would update the notification in Supabase
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    toast.success("Marked as read");
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

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">Notifications</h2>
        
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
                        onClick={() => markAsRead(notification.id)}
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
