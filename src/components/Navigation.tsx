
import { Link, useLocation } from "react-router-dom";
import { Calendar, PlusSquare, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Calendar, label: "Events", path: "/" },
    { icon: PlusSquare, label: "Scan", path: "/scanner" },
    { icon: Users, label: "People", path: "/people" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center z-50 nav-blur">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 transition-all",
              isActive 
                ? "text-campus-accent" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <item.icon size={24} className={cn(isActive ? "animate-pulse-light" : "")} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
