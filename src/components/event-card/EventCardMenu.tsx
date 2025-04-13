
import { Edit, Users, UserCheck, QrCode, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "qrcode.react";

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
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  
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

  const openQRDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQrDialogOpen(true);
  };
  
  if (!isInformationOfficer) return null;
  
  return (
    <>
      {canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 px-2 text-blue-500"
          onClick={handleEditEvent}
        >
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2"
        onClick={handleViewAttendees}
      >
        <Users className="h-3 w-3 mr-1" /> {interestedCount}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2"
        onClick={handleViewAttendees}
      >
        <UserCheck className="h-3 w-3 mr-1" /> {checkedInCount}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs h-7 px-2"
        onClick={openQRDialog}
      >
        <QrCode className="h-3 w-3 mr-1" /> QR
      </Button>
      
      {canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 px-2"
          onClick={toggleEventStatus}
        >
          {active ? (
            <><ToggleRight className="h-3 w-3 mr-1" /> Active</>
          ) : (
            <><ToggleLeft className="h-3 w-3 mr-1" /> Inactive</>
          )}
        </Button>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {title}</DialogTitle>
            <DialogDescription>
              Scan this QR code to check in to the event
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <QRCode 
              value={id.toString()} 
              size={200} 
              renderAs="canvas" 
              includeMargin={true}
            />
          </div>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                const canvas = document.querySelector("canvas");
                if (canvas) {
                  const dataUrl = canvas.toDataURL("image/png");
                  const link = document.createElement("a");
                  link.href = dataUrl;
                  link.download = `qr-code-event-${id}.png`;
                  link.click();
                }
              }}
            >
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventCardMenu;
