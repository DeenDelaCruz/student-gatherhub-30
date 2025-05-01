
import { Link, useLocation } from "react-router-dom";
import { Calendar, QrCode, Bell, User } from "lucide-react";
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
    
    if (isStudent || isInfoOfficer) {
      baseItems.push({ 
        icon: Bell, 
        label: "Notifications", 
        path: "/notifications",
        badge: unreadCount > 0 ? unreadCount : null
      });
    }
    
    baseItems.push({ icon: User, label: "Profile", path: "/profile" });
    
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-gradient-to-r from-[#14162199] to-[#1A1F2C99] border-t border-white/5 py-3 px-4 backdrop-blur-xl z-50">
      <div className="w-full mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center p-2 transition-all relative group",
                isActive 
                  ? "text-[#9b87f5]" 
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-[#FF6B95] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              <div className={cn(
                "relative p-2 rounded-lg transition-all duration-500",
                isActive ? "bg-[#1e204466] shadow-lg" : "bg-transparent group-hover:bg-[#1e204433]"
              )}>
                <item.icon size={20} className={cn(
                  "transition-all duration-500",
                  isActive ? "text-[#9b87f5]" : "text-current"
                )} />
                {isActive && (
                  <span className="absolute inset-0 bg-[#9b87f5]/10 animate-pulse rounded-lg" />
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium transition-all", 
                isActive ? "text-[#9b87f5]" : "text-current"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
