
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

// This function will be called from the VisitorRecordsPopover component
export const clearVisitorRecords = async (): Promise<boolean> => {
  try {
    // First check if the table exists by trying to select a row
    const { error: checkError } = await supabase
      .from('user_visits')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    if (checkError) {
      console.error("User visits tracking is not available:", checkError.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Visitor tracking is not available: " + checkError.message
      });
      return false;
    }
    
    const { error } = await supabase
      .from('user_visits')
      .delete()
      .neq('id', 'placeholder'); // This will delete all records
      
    if (error) {
      console.error("Error clearing visitor records:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear visitor records: " + error.message
      });
      return false;
    }
    
    toast({
      title: "Success",
      description: "All visitor records have been cleared"
    });
    return true;
  } catch (error) {
    console.error("Exception clearing visitor records:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "An unexpected error occurred while clearing visitor records"
    });
    return false;
  }
};

// New function to delete a specific visitor record by user ID
export const deleteVisitorRecord = async (userId: string): Promise<boolean> => {
  try {
    // Attempt to delete using the secure database function
    const { data, error } = await supabase
      .rpc('delete_visitor_record_by_user_id', { user_id_param: userId });
    
    if (error) {
      console.error("Error deleting visitor record:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete visitor record: " + error.message
      });
      return false;
    }
    
    toast({
      title: "Success",
      description: "Visitor record has been deleted"
    });
    return true;
  } catch (error) {
    console.error("Exception deleting visitor record:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "An unexpected error occurred while deleting visitor record"
    });
    return false;
  }
};
