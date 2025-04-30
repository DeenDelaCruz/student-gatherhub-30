
import { Edit, Users, UserCheck, QrCode, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EventCardMenuProps {
  isInformationOfficer: boolean;
  canEdit: boolean;
  active: boolean;
  id: number | string;
  title: string;
  interestedCount: number;
  checkedInCount: number;
  handleViewAttendees: (e: React.MouseEvent) => void;
  handleGenerateQR: (e: React.MouseEvent) => void;
}

const EventCardMenu = ({
  isInformationOfficer,
  canEdit,
  active,
  id,
  title,
  interestedCount,
  checkedInCount,
  handleViewAttendees,
  handleGenerateQR,
}: EventCardMenuProps) => {
  const navigate = useNavigate();
  
  const handleEditEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
      navigate(`/edit-event/${id.toString()}`);
    } else {
      toast.info(`Viewing event: ${title}`);
    }
  };
  
  const toggleEventStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("You can only change status of events you created");
      return;
    }
    
    const newStatus = !active;
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_active: newStatus })
        .eq("id", id.toString());
        
      if (error) throw error;
      
      toast.success(`Event ${newStatus ? 'activated' : 'deactivated'}: ${title}`);
    } catch (error: any) {
      console.error("Error updating event status:", error);
      toast.error(error.message || "Failed to update event status");
    }
  };
  
  if (!isInformationOfficer) return null;
  
  return (
    <>
      {canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 px-2 text-blue-400 bg-[#14162180] border border-white/5 hover:bg-blue-900/20 hover:border-blue-400/20"
          onClick={handleEditEvent}
        >
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2 bg-[#14162180] border border-white/5 hover:bg-white/5"
        onClick={handleViewAttendees}
      >
        <Users className="h-3 w-3 mr-1" /> {interestedCount}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2 bg-[#14162180] border border-white/5 hover:bg-white/5"
        onClick={handleViewAttendees}
      >
        <UserCheck className="h-3 w-3 mr-1" /> {checkedInCount}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2 bg-[#14162180] border border-white/5 hover:bg-white/5"
        onClick={handleGenerateQR}
      >
        <QrCode className="h-3 w-3 mr-1" /> QR
      </Button>
      
      {canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 px-2 bg-[#14162180] border border-white/5 hover:bg-white/5"
          onClick={toggleEventStatus}
        >
          {active ? (
            <><ToggleRight className="h-3 w-3 mr-1 text-green-400" /> Active</>
          ) : (
            <><ToggleLeft className="h-3 w-3 mr-1 text-gray-400" /> Inactive</>
          )}
        </Button>
      )}
    </>
  );
};

export default EventCardMenu;
