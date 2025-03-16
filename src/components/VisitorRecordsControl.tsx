
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth";
import { clearVisitorRecords } from "@/utils/adminUtils";
import { Users } from "lucide-react";

const VisitorRecordsControl = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  
  return (
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        <span>Recent Visitors</span>
      </Button>
    </PopoverTrigger>
  );
};

export const VisitorRecordsPopover = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  
  const handleClearRecords = async () => {
    await clearVisitorRecords();
  };
  
  return (
    <Popover>
      <VisitorRecordsControl />
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Recent Visitor Activity</h4>
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={handleClearRecords}
                    >
                      Clear Records
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete all visitor records</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Recent visitor information will appear here.</p>
            {/* This is where you would map through visitor data */}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VisitorRecordsPopover;
