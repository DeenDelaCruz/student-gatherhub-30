
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "./types";

export const fetchUserRoles = async (userId: string): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, user_name")
      .eq("user_id", userId);
      
    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
    
    return data.map(item => item.role) as UserRole[];
  } catch (error) {
    console.error("Error in fetchUserRoles:", error);
    return [];
  }
};

export const fetchProfileData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return null;
  }
};

export const fetchRolesWithNames = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, user_name")
      .eq("user_id", userId);
      
    if (error) {
      console.error("Error fetching user roles with names:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchRolesWithNames:", error);
    return [];
  }
};
