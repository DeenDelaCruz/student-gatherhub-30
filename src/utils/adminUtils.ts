
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// This function will be called from Admin components to clear visitor records
export const clearVisitorRecords = async (): Promise<boolean> => {
  // First check if it's available from ProtectedRoute
  // @ts-ignore
  if (typeof window !== 'undefined' && window.adminUtils?.clearVisitorRecords) {
    // @ts-ignore
    return window.adminUtils.clearVisitorRecords();
  }
  
  // Fallback implementation if not available from ProtectedRoute
  try {
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
