
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    
    // This is the corrected approach - delete all records using true condition
    const { error } = await supabase
      .from('user_visits')
      .delete()
      .not('id', 'is', null); // This will delete all records
      
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

// Function to delete a specific visitor record by user ID
export const deleteVisitorRecord = async (userId: string): Promise<boolean> => {
  try {
    // Get all records for this user
    const { data: userVisits, error: fetchError } = await supabase
      .from('user_visits')
      .select('id')
      .eq('user_id', userId);
      
    if (fetchError) {
      console.error("Error fetching user visits:", fetchError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user visits: " + fetchError.message
      });
      return false;
    }
    
    if (!userVisits || userVisits.length === 0) {
      toast({
        title: "Info",
        description: "No visitor records found for this user"
      });
      return true;
    }
    
    // Delete all visits for this user
    const { error: deleteError } = await supabase
      .from('user_visits')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Error deleting visitor records:", deleteError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete visitor records: " + deleteError.message
      });
      return false;
    }
    
    toast({
      title: "Success",
      description: "All visitor records for this user have been deleted"
    });
    return true;
  } catch (error) {
    console.error("Exception deleting visitor records:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "An unexpected error occurred while deleting visitor records"
    });
    return false;
  }
};
