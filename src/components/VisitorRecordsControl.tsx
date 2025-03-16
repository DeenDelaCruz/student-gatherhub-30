
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth";
import { Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clearVisitorRecords } from "@/utils/adminUtils";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

const VisitorRecordsControl = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 text-xs"
    >
      <Clock className="h-4 w-4" />
      <span>View All Visitors</span>
    </Button>
  );
};

export const VisitorRecordsPopover = ({ recentVisitors, loadingVisitors }: { 
  recentVisitors: any[]; 
  loadingVisitors: boolean;
}) => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [clearingRecords, setClearingRecords] = useState<boolean>(false);
  
  const handleClearVisitorRecords = async () => {
    setClearingRecords(true);
    try {
      const success = await clearVisitorRecords();
      if (success) {
        toast({
          title: "Success",
          description: "All visitor records have been cleared"
        });
      }
    } finally {
      setClearingRecords(false);
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <VisitorRecordsControl />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Recent Visitor Activity</h4>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearVisitorRecords}
              disabled={clearingRecords}
              className="h-7 text-xs"
            >
              {clearingRecords ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                "Clear Records"
              )}
            </Button>
          </div>
          
          {loadingVisitors ? (
            <div className="h-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-campus-accent"></div>
            </div>
          ) : recentVisitors.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>No recent visitor activity found.</p>
            </div>
          ) : (
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {recentVisitors.map((visitor, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{visitor.name || 'Unknown user'}</p>
                      <p className="text-xs text-muted-foreground">{visitor.email || 'No email'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {visitor.visit_time ? formatDistanceToNow(new Date(visitor.visit_time), { addSuffix: true }) : 'recently'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VisitorRecordsPopover;
