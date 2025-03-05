
import { Link, useLocation } from "react-router-dom";
import { Calendar, QrCode, Users, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | null;
}

const Navigation = () => {
  const location = useLocation();
  const { hasRole, user } = useAuth();
  const isStudent = hasRole("student") && !hasRole("information_officer") && !hasRole("admin");
  const isInfoOfficer = hasRole("information_officer");
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .eq("read", false);
        
        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread notifications count:", error);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to changes
    if (user) {
      const channel = supabase
        .channel('notification-count')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}` 
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  const getNavItems = () => {
    const baseItems: NavItem[] = [
      { icon: Calendar, label: "Events", path: "/" },
      { icon: QrCode, label: "Scanner", path: "/scanner" },
    ];
    
    // Show People button only for admins and information officers
    if (!isStudent) {
      baseItems.push({ icon: Users, label: "People", path: "/people" });
    }
    
    // Show Notifications button for students and information officers
    if (isStudent || isInfoOfficer) {
      baseItems.push({ 
        icon: Bell, 
        label: "Notifications", 
        path: "/notifications",
        badge: unreadCount > 0 ? unreadCount : null
      });
    }
    
    // Add Profile button for all users
    baseItems.push({ icon: User, label: "Profile", path: "/profile" });
    
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center z-50 nav-blur">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 transition-all relative",
              isActive 
                ? "text-campus-accent" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <item.icon size={24} className={cn(isActive ? "animate-pulse-light" : "")} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
